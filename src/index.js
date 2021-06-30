const program = require("commander")
const { fetch, proof } = require('./commands');

program
  .version('0.0.1')
  .description('Import external resources to local assets')

program
  .command("fetch <path> <lang>")
  .alias('f')
  .description('Include the path to the course folder and the language subfolder to update')
  .action((path, lang) => fetch(path, lang));
  
program
  .command("proof <path> <lang>")
  .alias('p')
  .description('Performs standard substitutions of particular words')
  .action((path, lang) => proof(path, lang))
  
program.parse(process.argv)