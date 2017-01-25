// dependencies

var fs = require("fs");
var path = require("path");
var yaml = require("js-yaml");
var logger = require("winston");
var ejs = require("ejs");
var defaults = require("lodash/defaults");

// scope

var defaultConfig = {
  logLevel: "error",
  inputFilePath: "data.yaml",
  outputFilePath: "output",
  templateFilePath: "template.ejs",
  pluginFilePath: "plugin.js",
  defaultPluginFilePath: path.join(__dirname, "plugins/identity.js")
};

// core functions

var loadYAMLFile = createSafeThunk("loadYAMLFile", function (logger, filePath) {
  logger.debug("args", { filePath });
  var source = fs.readFileSync(filePath, "utf8");
  return yaml.safeLoad(source);
});

var loadPlugin = createSafeThunk("loadPlugin", function (logger, filePath, fallBackFilePath) {
  logger.debug("args", { filePath, fallBackFilePath });
  var requirePath = fallBackFilePath;
  if (fs.existsSync(filePath))
    requirePath = path.resolve(filePath);
  logger.debug("requirePath", { requirePath });
  return require(requirePath);
});

var renderTemplate = createSafeThunk("renderTemplate", function (logger, filePath, doc) {
  logger.debug("args", { filePath, docType: typeof(doc) });
  var template = fs.readFileSync(filePath, "utf8");
  return ejs.render(template, doc, {
    filename: filePath
  });
});

// export the tool

module.exports = function main (config) {
  // bootstrap the tool
  config = defaults(config, defaultConfig);
  configure(config.logLevel);
  // set up the core logic
  var run = createSafeThunk("main", function (logger, config) {
    logger.debug("bootstrap", { defaultConfig, config });
    var doc = loadYAMLFile(config.inputFilePath);
    var plugin = loadPlugin(config.pluginFilePath, config.defaultPluginFilePath);
    doc = plugin(doc) || doc;
    var output = renderTemplate(config.templateFilePath, doc);
    fs.writeFileSync(config.outputFilePath, output);
  });
  // execute core logic
  run(config);
};

// helpers

function configure (logLevel) {
  // set the logging levels
  logger.setLevels({
    silent: 0, // not intended to be used
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  });
  // add colors to the levels
  logger.addColors({
    silent: "magenta",
    error: "red",
    warn: "yellow",
    info: "green",
    verbose: "blue",
    debug: "cyan",
    silly: "grey"
  });
  // configure the logger to output to the console
  logger.configure({
    level: logLevel,
    transports: [
      new logger.transports.Console({
        colorize: true
      })
    ]
  });
}

function createSafeThunk (name, callback) {
  return function (...args) {
    try {
      logger.debug(`${name}:start`, { numArgs: args.length });
      // add a specialized logger for the callback
      args.unshift({
        debug: specializedLogFn("debug", name),
        info: specializedLogFn("info", name),
        error: specializedLogFn("error", name),
        warn: specializedLogFn("warn", name)
      });
      // return the result of the callback invocation
      return callback.apply({}, args);
    } catch (error) {
      logger.error(`${name}:fail`);
      logger.error(error);
      process.exit(1);
    } finally {
      logger.debug(`${name}:end`);
    }
  }
}

function specializedLogFn (level, name) {
  return (category, params) => logger[level](`${name}:${category}`, params);
}

function normalizePlugin (plugin) {
  if (typeof(plugin) === "function") {
    logger.debug("plugin:normalize", { message: "supplied plugin is a function" });
    return plugin;
  } else {
    logger.warn("plugin:normalize", { message: "supplied plugin does not export a function, defaulting to identity function" });
    return a => a;
  }
}
