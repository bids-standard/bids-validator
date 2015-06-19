/**
 *  Copyright 2015 Zachary Michael - Squishmedia
 *
 *  This file is part of BIDS-Validator.
 *
 *  BIDS-Validator is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  BIDS-Validator is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with BIDS-Validator.  If not, see <http://www.gnu.org/licenses/>
 **/

var async  = require('async');
var utils  = require('../utils');

var TSV    = require('./tsv');
var JSON   = require('./json');
var NIFTI  = require('./nii');

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

        // validate NifTi
        if (file.name && file.name.indexOf('.nii') > -1) {

            // check if NifTi is gzipped
            if (file.name.indexOf('.gz') === -1) {
                var newError = {
                    evidence: file.name,
                    line: null,
                    character: null,
                    reason: 'NifTi files should be compressed using gzip.',
                    severity: 'warning'
                }
                errors.push({file: file, errors: [newError]});
            }

            // Psuedo-Code for validating NifTi header
            // utils.readFileHeader(file, function (header) {
            //     NIFTI(header, function (errs) {
            //         if (errs) {
            //             errors.push({file: file, errors: errs});
            //         }
            //     });
            // });

            cb();
            return;
        }

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