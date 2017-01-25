#! /usr/bin/env node

// dependencies

var fs = require("fs");
var yaml = require("js-yaml");
var logger = require("winston");
var argv = require("minimist")(process.argv);

// scope

var DEBUG = !!argv.debug || !!argv.d;

// main

try {
  configure();
  logger.debug("main:start", { DEBUG, argv });
  main();
  process.exit(0);
} catch (error) {
  logger.debug("main:error");
  logger.error(error);
  process.exit(1);
} finally {
  logger.debug("main:end");
}

function main () {
  var filePath = argv.input || argv.i;
  var doc = loadYAMLFile(filePath);
}

// helpers

function configure () {
  logger.configure({
    level: DEBUG ? "debug": "info",
    transports: [
      new winston.transports.Console()
    ]
  });
}

function loadYAMLFile (filePath) {
  try {
    logger.debug("loadYAMLFile:start", { filePath });
    var source = fs.readFileSync(filePath, "utf8");
    return yaml.safeLoad(source);
  } catch (error) {
    logger.error("loadYAMLFile:error");
    logger.error(error);
    process.exit(1);
  } finally {
    logger.debug("loadYAMLFile:start");
  }
}
