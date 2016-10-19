#!/usr/bin/env node

process.title = 'bids-validator';

var argv = require('yargs')
    .usage('Usage: $0 <dataset_directory> [options]')
    .help('help')
    .alias('help', 'h')
    .version(require('../package.json').version)
    .alias('version', 'v')
    .demand(1, 1)
    .boolean('ignoreWarnings')
    .describe('ignoreWarnings', 'disregard non-critical issues')
    .boolean('ignoreNiftiHeaders')
    .describe('ignoreNiftiHeaders', 'disregard NIfTI header content during validation')
    .boolean('verbose')
    .describe('verbose', 'Log more extensive information about issues.')
    .option('config', {
        alias: 'c',
        describe: 'Optional configuration file. See https://github.com/INCF/bids-validator for more info.'
    })
    .epilogue("This tool checks if a dataset in a given directory is \
compatible with the Brain Imaging Data Structure specification. To learn \
more about Brain Imaging Data Structure visit http://bids.neuroimaging.io")
    .argv;

// import and init command line interface
require('../cli')(argv._[0], argv);
