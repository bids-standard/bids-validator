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
 */
function start (fileList, callback) {
    quickTest(fileList, function (couldBeBIDS) {
        if (couldBeBIDS) {
            fullTest(fileList, callback);
        } else {
            callback('Invalid');
        }
    });
}

/**
 * Quick Test
 *
 * A quick test to see if it could be a BIDS
 * dataset based on structure/naming. If it
 * could be it will trigger the full validation
 * otherwise it will throw a callback with a
 * generic error.
 */
function quickTest (fileList, callback) {
    var couldBeBIDS = false;
    for (var key in fileList) {
        var file = fileList[key];
        var path = typeof window != 'undefined' ? file.webkitRelativePath : file.relativePath;
        if (path) {
            path = path.split('/');
            if (path.length > 5) {couldBeBIDS = false; break;}
            path = path.reverse();

            if (
                path[0].indexOf('.nii.gz') > -1 &&
                (path[1].indexOf('anatomy') > -1 ||
                 path[1].indexOf('functional') > -1 ||
                 path[1].indexOf('diffusion') > -1) &&
                (
                    (path[2] && path[2].indexOf('ses') > -1) ||
                    (path[2] && path[2].indexOf('sub') > -1)
                )
            ) {
                couldBeBIDS = true;
                break;
            }
        }
    }
    callback(couldBeBIDS);
}

/**
 * Full Test
 *
 * Takes on an array of files and starts
 * the validation process for a BIDS
 * package.
 */
function fullTest (fileList, callback) {
    var errors     = [];
    var warnings   = [];
    var NifTiFIles = [];
    var JSONFiles  = [];

    // validate individual files
    async.forEachOf(fileList, function (file, key, cb) {
        var path = typeof window != 'undefined' ? file.webkitRelativePath : file.relativePath;

        // validate NifTi
        if (file.name && file.name.indexOf('.nii') > -1) {
            NifTiFIles.push(path);
            // check if NifTi is gzipped
            if (file.name.indexOf('.gz') === -1) {
                var newError = {
                    evidence: file.name,
                    line: null,
                    character: null,
                    reason: 'NifTi files should be compressed using gzip.',
                    severity: 'error'
                }
                
                errors.push({file: file, errors: [newError]});
            }
            cb();
            return;
        }

        // validate tsv
        if (file.name && file.name.indexOf('.tsv') > -1) {
            utils.readFile(file, function (contents) {
                TSV(contents, function (errs, warns) {
                    if (errs && errs.length > 0) {
                        errors.push({file: file, errors: errs})
                    }
                    if (warns && warns.length > 0) {
                        warnings.push({file: file, errors: warns});
                    }
                    cb();
                });
            });
            return;
        }

        // validate json
        if (file.name && file.name.indexOf('.json') > -1) {
            JSONFiles.push(path);
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
        checkSidecars(NifTiFIles, JSONFiles);
        callback(errors, warnings);
    });
}

/**
 * Check Sidecars
 *
 * Takes an array of all NifTi files and an array
 * of all JSON files and returns errors for scans
 * without a corresponding sidecar metadata file.
 */
function checkSidecars (scans, JSONFiles) {

    var sidecars = [];

    // remove files from the lists that are perfect
    // matches or scan that do not require sidecars
    for (var i = scans.length -1; i > -1; i--) {
        var scan = scans[i];

        // remove perfect matches
        var scan = scan.replace('.nii.gz', '');
        var sidecarIndex = JSONFiles.indexOf(scan + '.json');
        if (sidecarIndex > -1) {
            scans.splice(i, 1);
            var sidecar = JSONFiles.splice(sidecarIndex, 1);
            sidecars.push(sidecar[0]);
        }

        // remove sbref scans
        if (scan.indexOf('sbref') > -1) {
            scans.splice(i, 1);
        }
    }

    console.log(scans);
    console.log(JSONFiles);
    console.log(sidecars);
}