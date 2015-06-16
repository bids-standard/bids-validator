var async  = require('async');
var utils  = require('../utils');

var TSV    = require('./tsv');
var JSON   = require('./json');

/**
 * BIDS
 *
 * Takes either a filelist array or
 * a path to a BIDS directory and
 * starts the validation process and
 * returns the errors as an argument
 * to the callback.
 */
module.exports = function (fileList, callback) {
    if (typeof fileList === 'object') {
        start(fileList, callback);
    } else if (typeof fileList === 'string') {
        utils.readDir(fileList, function (files) {
            start(files, callback);
        });
    }
};

/**
 * Start
 *
 * Takes on an array of files and starts
 * the validation process for a BIDS
 * package.
 */
function start (fileList, callback) {
    var errors = [];
    async.forEachOf(fileList, function (file, key, cb) {

        // validate tsv
        if (file.name && file.name.indexOf('.tsv') > -1) {
         utils.readFile(file, function (contents) {
             TSV(contents, function (errs) {
                    if (errs) {
                        errors.push({file: file, errors: errs})
                    }
                    cb();
                });
         });
            return;
        }

        // validate json
        if (file.name && file.name.indexOf('.json') > -1) {
            utils.readFile(file, function (contents) {
                JSON(contents, function (errs) {
                    if (errs) {
                        errors.push({file: file, errors: errs})
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