// dependencies ------------------------------------------------------

var async     = require('async');
var JSHINT    = require('jshint').JSHINT;
var utils     = require('./utils');

// public api --------------------------------------------------------

var validate = {
	BIDS: BIDS,
	BIDSPath: BIDSPath,
	JSON: JSON,
	TSV: TSV
};

// implementations ---------------------------------------------------

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
            utils.readFile(file, function (contents) {
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
    utils.readDir(path, function (files) {
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
    utils.readFile(file, function (contents) {
        // var rows = contents.split('\n');
        // async.each(rows, function (row) {
        //     var columnsInRow = row.split('\t');
        // });
        callback();
    });
}

// exports -----------------------------------------------------------

module.exports = validate;