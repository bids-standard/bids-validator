var async  = require('async');
var utils  = require('../utils');

var TSV    = require('./tsv');
var json   = require('./json');
var NIFTI  = require('./nii');
var bval   = require('./bval');
var bvec   = require('./bvec');
var session = require('./session');
var headerFields = require('./headerFields');

var BIDS = {

    options:  {},
    issues: [],

    /**
     * Start
     *
     * Takes either a filelist array or
     * a path to a BIDS directory and an
     * options object and starts
     * the validation process and
     * returns the errors and warnings as
     * arguments to the callback.
     */
    start: function (dir, options, callback) {
        var self = BIDS;
        self.options = options ? self.parseOptions(options) : {};
        BIDS.reset();
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
                    if (path[1] === 'derivatives') {continue;}
                    path = path.reverse();

                    if (
                        path[0].includes('.nii') &&
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
        utils.summary(fileList);
        var self = this;

        var jsonContentsDict = {},
            bContentsDict    = {},
            events           = [],
            niftis           = [],
            headers          = [];

        // validate individual files
        async.forEachOf(fileList, function (file, key, cb) {
            file.relativePath = utils.files.relativePath(file);

            // validate path naming
            if (!utils.type.isBIDS(file.relativePath)) {
                self.issues.push(new utils.Issue({
                    file: file,
                    evidence: file.name,
                    code: 1
                }));
                cb();
            }

            // capture niftis for later validation
            else if (file.name.includes('.nii')) {
                niftis.push(file);
                cb();
            }


            // validate tsv
            else if (file.name && file.name.endsWith('.tsv')) {
                utils.files.readFile(file, function (contents) {
                    var isEvents = file.name.endsWith('_events.tsv');
                    if (isEvents) {events.push(file.relativePath);}
                    TSV(file, contents, isEvents, function (issues) {
                        self.issues = self.issues.concat(issues);
                        cb();
                    });
                });
            }

            // validate bvec
            else if (file.name && file.name.endsWith('.bvec')) {
                utils.files.readFile(file, function (contents) {
                    bContentsDict[file.relativePath] = contents;
                    bvec(file, contents, function (issues) {
                        self.issues = self.issues.concat(issues);
                        cb();
                    });
                });
            }

            // validate bval
            else if (file.name && file.name.endsWith('.bval')) {
                utils.files.readFile(file, function (contents) {
                    bContentsDict[file.relativePath] = contents;
                    bval(file, contents, function (issues) {
                        self.issues = self.issues.concat(issues);
                        cb();
                    });
                });
            }

            // validate json
            else if (file.name && file.name.endsWith('.json')) {
                utils.files.readFile(file, function (contents) {
                    json(file, contents, function (issues, jsObj) {
                        self.issues = self.issues.concat(issues);
                        jsonContentsDict[file.relativePath] = jsObj;
                        cb();
                    });
                });
            } else {
                cb();
            }

        }, function () {
            async.forEachOf(niftis, function (file, key, cb) {
                if (self.options.ignoreNiftiHeaders) {
                    NIFTI(null, file, jsonContentsDict, bContentsDict, fileList, events, function (issues) {
                        self.issues = self.issues.concat(issues);
                        cb();
                    });
                } else {
                    utils.files.readNiftiHeader(file, function (header) {
                        // check if header could be read
                        if (header && header.hasOwnProperty('error')) {
                            self.issues.push(header.error);
                            cb();
                        } else {
                            headers.push([file, header]);
                            NIFTI(header, file, jsonContentsDict, bContentsDict, fileList, events, function (issues) {
                                self.issues = self.issues.concat(issues);
                                cb();
                            });
                        }
                    });
                }

            }, function(){
                self.issues = self.issues.concat(headerFields(headers));
                self.issues = self.issues.concat(session(fileList));
                var issues = self.formatIssues(self.issues);
                callback(issues.errors, issues.warnings);
            });
        });
    },

    /**
     * Format Issues
     */
    formatIssues: function () {
        var errors = [], warnings = [];

        // organize by issue code
        var categorized = {};
        for (var i = 0; i < this.issues.length; i++) {
            var issue = this.issues[i];
            if (!categorized[issue.code]) {
                categorized[issue.code] = utils.issues[issue.code];
                categorized[issue.code].files = [];
            }
            categorized[issue.code].files.push(issue);
        }

        // organize by severity
        for (var key in categorized) {
            issue = categorized[key];
            issue.code = key;
            if (issue.severity === 'error') {
                errors.push(issue);
            } else if (issue.severity === 'warning' && !this.options.ignoreWarnings) {
                warnings.push(issue);
            }

        }

        return {errors: errors, warnings: warnings};
    },

    /**
     * Reset
     *
     * Resets the in object data back to original values.
     */
    reset: function () {
        this.issues = [];
    },

    /**
     * Parse Options
     */
    parseOptions: function (options) {
        return {
            ignoreWarnings:     options.ignoreWarnings     ? true : false,
            ignoreNiftiHeaders: options.ignoreNiftiHeaders ? true : false
        };
    }
};

module.exports = BIDS;
