#! /usr/bin/env node

var renderYAML = require("./index");
var argv = require("minimist")(process.argv);

renderYAML({
  logLevel: argv["log-level"] || argv.l, 
  inputFilePath: argv.input || argv.i,
  outputFilePath: argv.output || argv.o,
  templateFilePath: argv.template || argv.t,
  pluginFilePath: argv.plugin || argv.p
});
