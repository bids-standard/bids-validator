var async  = require('async');
var utils  = require('../utils');

var TSV    = require('./tsv');
var JSON   = require('./json');
var NIFTI  = require('./nii');

var BIDS = {

    errors:   [],
    warnings: [],

    /**
     * Start
     *
     * Takes either a filelist array or
     * a path to a BIDS directory and
     * starts the validation process and
     * returns the errors and warnings as
     * arguments to the callback.
     */
    start: function (dir, callback) {
        BIDS.reset();
        var self = BIDS;
        utils.files.readDir(dir, function (files) {
            self.quickTest(files, function (couldBeBIDS) {
                if (couldBeBIDS) {
                    self.fullTest(files, callback);
                } else {
                    callback('Invalid');
                }
            });
        });
    },

    /**
     * Quick Test
     *
     * A quick test to see if it could be a BIDS
     * dataset based on structure/naming. If it
     * could be it will trigger the full validation
     * otherwise it will throw a callback with a
     * generic error.
     */
    quickTest: function (fileList, callback) {
        var couldBeBIDS = false;
        for (var key in fileList) {
            if (fileList.hasOwnProperty(key)) {
                var file = fileList[key];
                var path = utils.files.relativePath(file);
                if (path) {
                    path = path.split('/');
                    if (path.length > 5) {couldBeBIDS = false; break;}
                    path = path.reverse();

                    if (
                        path[0].endsWith('.nii.gz') &&
                        (
                            path[1] == 'anat' ||
                            path[1] == 'func' ||
                            path[1] == 'dwi'
                        ) &&
                        (
                            (path[2] && path[2].indexOf('ses-') == 0) ||
                            (path[2] && path[2].indexOf('sub-') == 0)
                        )
                    ) {
                        couldBeBIDS = true;
                        break;
                    }
                }
            }
        }
        callback(couldBeBIDS);
    },

    /**
     * Full Test
     *
     * Takes on an array of files and starts
     * the validation process for a BIDS
     * package.
     */
    fullTest: function (fileList, callback) {
        var self = this;

        var jsonContentsDict = {};
        var niftis = [];

        // validate individual files
        async.forEachOf(fileList, function (file, key, cb) {
            var path = utils.files.relativePath(file);
            if (
                !(
                    utils.type.isTopLevel(path)          ||
                    utils.type.isCodeOrDerivatives(path) ||
                    utils.type.isSessionLevel(path)      ||
                    utils.type.isSubjectLevel(path)      ||
                    utils.type.isAnat(path)              ||
                    utils.type.isDWI(path)               ||
                    utils.type.isFunc(path)              ||
                    utils.type.isCont(path)              ||
                    utils.type.isFieldMap(path)
                )
            ) {
                var newWarning = new utils.Issue({
                    evidence: file.name,
                    reason: "This file is not part of the BIDS specification, make sure it isn't included in the " +
                    "dataset by accident. Data derivatives (processed data) should be placed in /derivatives folder.",
                    severity: 'warning'
                });
                self.warnings.push({file: file, path: path, errors: [newWarning]});
                return cb();
            }

            else if (file.name.endsWith('.nii.gz')) {
                niftis.push(file);
                cb();
            }


            // validate tsv
            else if (file.name && file.name.endsWith('.tsv')) {
                utils.files.readFile(file, function (contents) {
                    var isEvents = file.name.endsWith('_events.tsv');
                    TSV(contents, isEvents, function (errs, warns) {
                        if (errs && errs.length > 0) {
                            self.errors.push({file: file, path: path, errors: errs})
                        }
                        if (warns && warns.length > 0) {
                            self.warnings.push({file: file, path: path, errors: warns});
                        }
                        return cb();
                    });
                });
            }

            // validate json
            else if (file.name && file.name.endsWith('.json')) {
                utils.files.readFile(file, function (contents) {
                    JSON(contents, function (errs, warns, jsObj) {
                        jsonContentsDict[path] = jsObj;
                        if (errs  && errs.length > 0) {
                            self.errors.push({file: file, path: path, errors: errs})
                        }
                        if (warns && warns.length > 0) {
                            self.warnings.push({file: file, path: path, errors: warns});
                        }
                        return cb();
                    });
                });
            } else {
                return cb();
            }

        }, function () {
            async.forEachOf(niftis, function (file, key, cb) {
                utils.files.readNiftiHeader(file, function (header) {
                    var path = utils.files.relativePath(file);
                    NIFTI(header, path, jsonContentsDict, function (errs, warns) {
                        if (errs && errs.length > 0) {
                            self.errors.push({file: file, path: path, errors: errs})
                        }
                        if (warns && warns.length > 0) {
                            self.warnings.push({file: file, path: path, errors: warns});
                        }
                        return cb();
                    });
                });
            }, function(){
                callback(self.errors, self.warnings);
            });
        });
    },

    /**
     * Reset
     *
     * Resets the in object data back to original values.
     */
    reset: function () {
        this.errors = [];
        this.warnings = [];
    }
};

module.exports = BIDS;