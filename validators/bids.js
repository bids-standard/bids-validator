var async  = require('async');
var utils  = require('../utils');

var TSV    = require('./tsv');
var JSON   = require('./json');
var NIFTI  = require('./nii');

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var BIDS = {

    errors:   [],
    warnings: [],
    sidecars: [],

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
        utils.readDir(dir, function (files) {
            self.quickTest(files, function (couldBeBIDS) {
                if (couldBeBIDS) {
                    self.determineSidecars(files, function () {
                        self.fullTest(files, callback);
                    });
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
                var path = utils.relativePath(file);
                if (path) {
                    path = path.split('/');
                    if (path.length > 5) {couldBeBIDS = false; break;}
                    path = path.reverse();

                    if (
                        path[0].endsWith('.nii.gz') &&
                        (path[1] == 'anat' ||
                        path[1] == 'func' ||
                        path[1] == 'dwi') &&
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
     * Determine sidecars
     *
     * Compares JSON files and scans to determine which
     * JSON files are metadata sidecars and which scans
     * are missing a sidecar.
     */
    determineSidecars: function (fileList, callback) {
        var self      = this;
        var scans     = [];
        var JSONFiles = [];

        // collect nifti and json files
        for (var key in fileList) {
            if (fileList.hasOwnProperty(key)) {
                var file = fileList[key];
                var path = utils.relativePath(file);
                if (file.name && file.name.endsWith('.nii.gz')) {scans.push(path);}
                if (file.name && file.name.endsWith('.json'))   {JSONFiles.push(path);}
            }
        }

        // compare scans against json files
        for (var i = scans.length -1; i > -1; i--) {
            var scan = scans[i];

            // remove perfect matches
            var scan = scan.replace('.nii.gz', '');
            var sidecarIndex = JSONFiles.indexOf(scan + '.json');
            if (sidecarIndex > -1) {
                scans.splice(i, 1);
                var sidecar = JSONFiles.splice(sidecarIndex, 1);
                self.sidecars.push(sidecar[0]);
            }

            // remove sbref scans & metadata
            if (scan.indexOf('sbref') > -1 || scan == 'dataset_description.json') {
                scans.splice(i, 1);
            }
        }

        callback();
    },

    /**
     * Check if the file has appropriate name for a top level file
     */
    isTopLevel: function(path) {
        var fixedTopLevelNames = ["/README", "/CHANGES", "/dataset_description.json", "/participants.tsv"];

        var funcTopRe = RegExp('^\\/(?:ses-[a-zA-Z0-9]+_)?task-[a-zA-Z0-9]+(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?'
            + '(_bold.json|_events.tsv|_physio.json|_stim.json)$');

        var dwiTopRe = RegExp('^\\/(?:ses-[a-zA-Z0-9]+)?(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?(?:_)?'
            + 'dwi.(?:json|bval|bvec)$');


        if (fixedTopLevelNames.indexOf(path) != -1 || funcTopRe.test(path) || dwiTopRe.test(path)) {
            return true;
        } else {
            return false;
        }
    },

    isCodeOrDerivatives: function(path) {
        var codeOrDerivatives = RegExp('^\\/(?:code|derivatives)\\/(?:.*)$');
        return codeOrDerivatives.test(path);
    },

    /**
     * Check if the file has appropriate name for a session level
     */
    isSessionLevel: function(path) {
        var scansRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?\\1(_\\2)?_scans.tsv$');
        var match = scansRe.exec(path);

        // we need to do this because JS does not support conditional groups
        if (match){
            if ((match[2] && match[3]) || !match[2]) {
                return true;
            }
        }
        return false;
    },

    /**
     * Check if the file has appropriate name for a subject level
     */
    isSubjectLevel: function(path) {
        var scansRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/\\1_sessions.tsv$');
        return scansRe.test(path);
    },

    /**
     * Check if the file has a name appropriate for an anatomical scan
     */
    isAnat: function(path) {
        var suffixes = ["T1w", "T2w", "T1map", "T2map", "FLAIR", "PD", "PDT2", "inplaneT1", "inplaneT2","angio",
            "defacemask", "SWImagandphase"];
        var anatRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?anat' +
            '\\/\\1(_\\2)?(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?_(?:'
            + suffixes.join("|")
            + ').(nii.gz|json)$');
        var match = anatRe.exec(path);

        // we need to do this because JS does not support conditional groups
        if (match){
            if ((match[2] && match[3]) || !match[2]) {
                return true;
            }
        }
        return false;
    },

    /**
     * Check if the file has a name appropriate for a diffusion scan
     */
    isDWI: function(path) {
        var suffixes = ["dwi"];
        var anatRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?dwi' +
            '\\/\\1(_\\2)?(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?_(?:'
            + suffixes.join("|")
            + ').(nii.gz|json|bvec|bval)$');
        var match = anatRe.exec(path);

        // we need to do this because JS does not support conditional groups
        if (match){
            if ((match[2] && match[3]) || !match[2]) {
                return true;
            }
        }
        return false;
    },

    /**
     * Check if the file has a name appropriate for a fieldmap scan
     */
    isFieldMap: function(path) {
        var suffixes = ["phasediff", "phase1", "phase2", "magnitude1", "magnitude2", "fieldmap", "epi"];
        var anatRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?fmap' +
            '\\/\\1(_\\2)?(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?_(?:'
            + suffixes.join("|")
            + ').(nii.gz|json)$');
        var match = anatRe.exec(path);

        // we need to do this because JS does not support conditional groups
        if (match){
            if ((match[2] && match[3]) || !match[2]) {
                return true;
            }
        }

    },

    /**
     * Check if the file has a name appropriate for a functional scan
     */
    isFunc: function(path) {
        var funcRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?func' +
            '\\/\\1(_\\2)?_task-[a-zA-Z0-9]+(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?'
            + '(?:_bold.nii.gz|_bold.json|_events.tsv|_physio.tsv.gz|_stim.tsv.gz|_physio.json|_stim.json)$');
        var match = funcRe.exec(path);

        // we need to do this because JS does not support conditional groups
        if (match){
            if ((match[2] && match[3]) || !match[2]) {
                return true;
            }
        }
        return false;
    },

    isCont: function(path) {
        var contRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?func' +
            '\\/\\1(_\\2)?_task-[a-zA-Z0-9]+(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?' +
            '(?:_recording-[a-zA-Z0-9]+)?'
            + '(?:_physio.tsv.gz|_stim.tsv.gz|_physio.json|_stim.json)$');
        var match = contRe.exec(path);

        // we need to do this because JS does not support conditional groups
        if (match){
            if ((match[2] && match[3]) || !match[2]) {
                return true;
            }
        }
        return false;
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


        // validate individual files
        async.forEachOf(fileList, function (file, key, cb) {
            var path = utils.relativePath(file);
            if (!(self.isTopLevel(path) || self.isCodeOrDerivatives(path) || self.isSessionLevel(path) || self.isSubjectLevel(path) || self.isAnat(path)
                || self.isDWI(path) || self.isFunc(path) || self.isCont(path) || self.isFieldMap(path))) {
                var newWarning = {
                    evidence: file.name,
                    line: null,
                    character: null,
                    reason: "This file is not part of the BIDS specification, make sure it isn't included in the " +
                    "dataset by accident. Data derivatives (processed data) should be placed in /derivatives folder.",
                    severity: 'warning'
                };
                self.warnings.push({path: path, errors: [newWarning]});
            }

            // validate NifTi
            if (file.name && file.name.endsWith('.nii')) {
                var newError = {
                    evidence: file.name,
                    line: null,
                    character: null,
                    reason: 'NifTi files should be compressed using gzip.',
                    severity: 'error'
                };
                self.errors.push({path: path, errors: [newError]});
                return cb();
            }

            // validate tsv
            else if (file.name && file.name.endsWith('.tsv')) {
                utils.readFile(file, function (contents) {
                    var isEvents = file.name.endsWith('_events.tsv');
                    TSV(contents, isEvents, function (errs, warns) {
                        if (errs && errs.length > 0) {
                            self.errors.push({path: path, errors: errs})
                        }
                        if (warns && warns.length > 0) {
                            self.warnings.push({path: path, errors: warns});
                        }
                        return cb();
                    });
                });
            }

            // validate json
            else if (file.name && file.name.endsWith('.json')) {
                var isSidecar = self.isSidecar(file);
                var isBOLDSidecar = (isSidecar && file.name.endsWith('_bold.json'));
                utils.readFile(file, function (contents) {
                    JSON(contents, isBOLDSidecar, function (errs) {
                        if (errs  && errs.length > 0) {
                            self.errors.push({path: path, errors: errs})
                        }
                        return cb();
                    });
                });
            } else {
                return cb();
            }

        }, function () {
            callback(self.errors, self.warnings);
        });
    },

    /**
     * Is Sidecar
     *
     * Takes a file object and returns a boolean value
     * of whether or not it is a sidecar.
     */
    isSidecar: function (file) {
        return this.sidecars.indexOf(utils.relativePath(file)) > -1;
    },

    /**
     * Reset
     *
     * Resets the in object data back to original values.
     */
    reset: function () {
        this.errors = [];
        this.warnings = [];
        this.sidecars = [];
    }
};

module.exports = BIDS;