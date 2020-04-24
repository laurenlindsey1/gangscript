#!/usr/bin/env node

const yargs = require("yargs"); //?


const { argv } = require("yargs")
  .usage("$0 [-a] [-o] [-i] [--target [x86|c|js]] filename")
  .boolean(["a", "o", "i"])
  .describe("a", "show abstract syntax tree after parsing then stop")
  .describe("o", "do optimizations")
  .describe("i", "generate and show the intermediate code then stop")
  .describe("target", "generate code for x86, C, or JavaScript")
  .default({ target: "js" })
  .demand(1);

const fs = require("fs");
const util = require("util");
const parse = require("./syntax/parser");
const Context = require("./semantics/context");
const generate = require("./backend/javascript-generator");

fs.readFile(argv._[0], "utf-8", (error, text) => {
  if (error) {
    console.error(error);
    return;
  }
  let program = parse(text);
  if (argv.a) {
    console.log(util.inspect(program, { depth: null }));
    return;
  }
  if (argv.i) {
    console.log(graphView(program));
    return;
  }
  program.gen();

});
