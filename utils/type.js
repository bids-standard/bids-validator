/**
 * Type
 *
 * A library of functions that take a file path and return a boolean
 * representing whether the given file path is valid within the
 * BIDS specification requirements.
 */
module.exports = {

    /**
     * Is BIDS
     *
     * Check if a given path is valid within the
     * bids spec.
     */
    isBIDS: function(path) {
        return (
            this.isTopLevel(path)          ||
            this.isCodeOrDerivatives(path) ||
            this.isSessionLevel(path)      ||
            this.isSubjectLevel(path)      ||
            this.isAnat(path)              ||
            this.isDWI(path)               ||
            this.isFunc(path)              ||
            this.isBehavioral(path)               ||
            this.isCont(path)              ||
            this.isFieldMap(path)
        );
    },

    /**
     * Check if the file has appropriate name for a top level file
     */
    isTopLevel: function(path) {
        var fixedTopLevelNames = ["/README", "/CHANGES", "/dataset_description.json", "/participants.tsv",
            "/phasediff.json", "/phase1.json", "/phase2.json" ,"/fieldmap.json"];

        var funcTopRe = RegExp('^\\/(?:ses-[a-zA-Z0-9]+_)?task-[a-zA-Z0-9]+(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?'
            + '(_bold.json|_events.tsv|_physio.json|_stim.json)$');

        var dwiTopRe = RegExp('^\\/(?:ses-[a-zA-Z0-9]+)?(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?(?:_)?'
            + 'dwi.(?:json|bval|bvec)$');

        var multiDirFieldmapRe = RegExp('^\\/(?:dir-[0-9]+)_epi.json$');


        if (fixedTopLevelNames.indexOf(path) != -1 || funcTopRe.test(path) || dwiTopRe.test(path) || multiDirFieldmapRe.test(path)) {
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
        return conditionalMatch(scansRe, path);
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
            + ').(nii.gz|nii|json)$');
        return conditionalMatch(anatRe, path);
    },

    /**
     * Check if the file has a name appropriate for a diffusion scan
     */
    isDWI: function(path) {
        var suffixes = ["dwi", "sbref"];
        var anatRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?dwi' +
            '\\/\\1(_\\2)?(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?_(?:'
            + suffixes.join("|")
            + ').(nii.gz|nii|json|bvec|bval)$');
        return conditionalMatch(anatRe, path);
    },

    /**
     * Check if the file has a name appropriate for a fieldmap scan
     */
    isFieldMap: function(path) {
        var suffixes = ["phasediff", "phase1", "phase2", "magnitude1", "magnitude2", "fieldmap", "epi"];
        var anatRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?fmap' +
            '\\/\\1(_\\2)?(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_dir-[0-9]+)?(?:_run-[0-9]+)?_(?:'
            + suffixes.join("|")
            + ').(nii.gz|nii|json)$');
        return conditionalMatch(anatRe, path);
    },

    /**
     * Check if the file has a name appropriate for a functional scan
     */
    isFunc: function(path) {
        var funcRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?func' +
            '\\/\\1(_\\2)?_task-[a-zA-Z0-9]+(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?'
            + '(?:_bold.nii.gz|_bold.nii|_bold.json|_sbref.nii.gz|_sbref.json|_events.tsv|_physio.tsv.gz|_stim.tsv.gz|_physio.json|_stim.json)$');
        return conditionalMatch(funcRe, path);
    },

    isBehavioral: function(path) {
        var funcBeh = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?beh' +
            '\\/\\1(_\\2)?_task-[a-zA-Z0-9]+(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?'
            + '(?:_beh.json|_events.tsv|_physio.tsv.gz|_stim.tsv.gz|_physio.json|_stim.json)$');
        return conditionalMatch(funcBeh, path);
    },

    isFuncBold: function(path) {
        var funcRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?func' +
            '\\/\\1(_\\2)?_task-[a-zA-Z0-9]+(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?'
            + '(?:_bold.nii.gz|_bold.nii|_sbref.nii.gz|_sbref.nii)$');
        return conditionalMatch(funcRe, path);
    },

    isCont: function(path) {
        var contRe = RegExp('^\\/(sub-[a-zA-Z0-9]+)' +
            '\\/(?:(ses-[a-zA-Z0-9]+)' +
            '\\/)?(?:func|beh)' +
            '\\/\\1(_\\2)?_task-[a-zA-Z0-9]+(?:_acq-[a-zA-Z0-9]+)?(?:_rec-[a-zA-Z0-9]+)?(?:_run-[0-9]+)?' +
            '(?:_recording-[a-zA-Z0-9]+)?'
            + '(?:_physio.tsv.gz|_stim.tsv.gz|_physio.json|_stim.json)$');
        return conditionalMatch(contRe, path);
    }

};

function conditionalMatch (expression, path) {
    var match = expression.exec(path);

        // we need to do this because JS does not support conditional groups
        if (match){
            if ((match[2] && match[3]) || !match[2]) {
                return true;
            }
        }
        return false;
}