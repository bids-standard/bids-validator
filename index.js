// dependencies -------------------------------------------------------------------

var JSHINT    = require('jshint').JSHINT;
var async     = require('async');
var fileUtils = require('./files');

// public API ---------------------------------------------------------------------

var validate = {
    BIDS: BIDS,
    BIDSPath: BIDSPath,
    JSON: JSON,
    TSV: TSV
};

// command line inteface ----------------------------------------------------------

var args = process.argv;
var dir  = args[2];

if (dir) {
    validate.BIDSPath(dir, function (errors) {
        for (var i = 0; i < errors.length; i++) {
            console.log(errors[i]);
        }
    });
}

// implementations ----------------------------------------------------------------

function BIDS (fileList, callback) {
    var errors = [];
    async.forEachOf(fileList, function (file, key, cb) {

        // validate tsv
        if (file.name && file.name.indexOf('.tsv') > -1) {
            validate.TSV(file, function () {
                cb();
            });
            return;
        }

        // validate json
        if (file.name && file.name.indexOf('.json') > -1) {
            fileUtils.read(file, function (contents) {
                validate.JSON(contents, function (err) {
                    if (err) {
                        errors.push({file: file, errors: err})
                    }
                    cb();
                });
            });
        } else {
            cb();
        }
    
    }, function () {
        callback(errors);
    });
}

function BIDSPath (path, callback) {
    fileUtils.readDir(path, function (files) {
        BIDS(files, function (errors) {
            callback(errors);
        });
    });
}

function JSON (contents, callback) {
    if (!JSHINT(contents)) {
        var out = JSHINT.data(),
        errors = out.errors;
        callback(errors);
    } else {
        callback(null);
    }
}

function TSV (file, callback) {
    fileUtils.read(file, function (contents) {
        // var rows = contents.split('\n');
        // async.each(rows, function (row) {
        //     var columnsInRow = row.split('\t');
        // });
        callback();
    });
}

module.exports = validate;