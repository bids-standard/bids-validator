var async = require('async');
var utils = require('../utils');
var Issue = utils.Issue;

/**
 * NIFTI
 *
 * Takes a NifTi header, a file path and a callback
 * as arguments. And callsback with any issues
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function NIFTI (header, file, jsonContentsDict, events, callback) {
    var path = file.relativePath;
    var issues = [];
    var potentialSidecars = potentialLocations(path.replace(".nii.gz", ".json"));
    var potentialEvents   = potentialLocations(path.replace("bold.nii.gz", "events.tsv"));
    var mergedDictionary  = generateMergedSidecarDict(potentialSidecars, jsonContentsDict);
    var sidecarMessage    = "It can be included one of the following locations: " + potentialSidecars.join(", ");
    var eventsMessage     = "It can be included one of the following locations: " + potentialEvents.join(", ");

    if (missingEvents(path, potentialEvents, events)) {
        issues.push(new Issue({
            code: 25,
            file: file,
            reason: 'Task scans should have a correspondings events.tsv file. ' + eventsMessage
        }));
    }

    // check if header could be read
    if (header && header.hasOwnProperty('error')) {
        issues.push(new Issue({
            code: 26,
            file: file
        }));
    } else if (header) {
        // Define repetition time from header and coerce to seconds.
        var repetitionTime = header.pixdim[4];
        var repetitionUnit = header.xyzt_units[3];
        if (repetitionUnit === 'ms') {repetitionTime = repetitionTime / 1000;    repetitionUnit = 's';}
        if (repetitionUnit === 'us') {repetitionTime = repetitionTime / 1000000; repetitionUnit = 's';}
    }

    if (path.endsWith("_bold.nii.gz") || path.endsWith("_sbref.nii.gz") || path.endsWith("_dwi.nii.gz")) {
        if (!mergedDictionary.hasOwnProperty('EchoTime')) {
            issues.push(new Issue({
                file: file,
                code: 6,
                reason: "You should should define 'EchoTime' for this file. If you don't provide this information field map correction will not be possible. " + sidecarMessage
            }));
        }
        if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {
            issues.push(new Issue({
                file: file,
                code: 7,
                reason: "You should should define 'PhaseEncodingDirection' for this file. If you don't provide this information field map correction will not be possible. " + sidecarMessage
            }));
        }
        if (!mergedDictionary.hasOwnProperty('EffectiveEchoSpacing')) {
            issues.push(new Issue({
                file: file,
                code: 8,
                reason: "You should should define 'EffectiveEchoSpacing' for this file. If you don't provide this information field map correction will not be possible. " + sidecarMessage
            }));
        }
    }
    if (path.endsWith("_dwi.nii.gz")) {
        if (!mergedDictionary.hasOwnProperty('TotalReadoutTime')) {
            issues.push(new Issue({
                file: file,
                code: 9,
                reason: "You should should define 'TotalReadoutTime' for this file. If you don't provide this information field map correction using TOPUP might not be possible. " + sidecarMessage
            }));
        }
    }
    // we don't need slice timing or repetition time for SBref
    if (path.endsWith("_bold.nii.gz")) {
        if (!mergedDictionary.hasOwnProperty('RepetitionTime')) {
            issues.push(new Issue({
                file: file,
                code: 10,
                reason: "You have to define 'RepetitionTime' for this file. " + sidecarMessage
            }));
        }

        if (repetitionTime) {
            if (repetitionUnit !== 's') {
                issues.push(new Issue({
                    file: file,
                    code: 11
                }));
            } else if (repetitionTime !== mergedDictionary.RepetitionTime) {
                issues.push(new Issue({
                    file: file,
                    code: 12,
                    reason: "Repetition time defined in JSON (" + mergedDictionary.RepetitionTime +" sec.) did not match the one defined in the NIFTI header (" + repetitionTime + " sec.)" + sidecarMessage
                }));
            }
        }

        if (!mergedDictionary.hasOwnProperty('SliceTiming')) {
            issues.push(new Issue({
                file: file,
                code: 13,
                reason: "You should should define 'SliceTiming' for this file. If you don't provide this information slice time correction will not be possible. " + sidecarMessage
            }));
        }
        if (!mergedDictionary.hasOwnProperty('SliceEncodingDirection')) {
            issues.push(new Issue({
                file: file,
                code: 14,
                reason: "You should should define 'SliceEncodingDirection' for this file. If you don't provide this information slice time correction will not be possible. " + sidecarMessage
            }));
        }
    }
    else if (path.endsWith("_phasediff.nii.gz")){
        if (!mergedDictionary.hasOwnProperty('EchoTimeDifference')) {
            issues.push(new Issue({
                file: file,
                code: 15,
                reason: "You have to define 'EchoTimeDifference' for this file. " + sidecarMessage
            }));
        }
    } else if (path.endsWith("_phase1.nii.gz") || path.endsWith("_phase2.nii.gz")){
        if (!mergedDictionary.hasOwnProperty('EchoTime')) {
            issues.push(new Issue({
                file: file,
                code:16,
                reason: "You have to define 'EchoTime' for this file. " + sidecarMessage
            }));
        }
    } else if (path.endsWith("_fieldmap.nii.gz")){
        if (!mergedDictionary.hasOwnProperty('Units')) {
            issues.push(new Issue({
                file: file,
                code: 17,
                reason: "You have to define 'Units' for this file. " + sidecarMessage
            }));
        }
    } else if (path.endsWith("_epi.nii.gz")){
        if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {
            issues.push(new Issue({
                file: file,
                code: 18,
                reason: "You have to define 'PhaseEncodingDirection' for this file. " + sidecarMessage
            }));
        }
        if (!mergedDictionary.hasOwnProperty('TotalReadoutTime')) {
            issues.push(new Issue({
                file: file,
                code: 19,
                reason: "You have to define 'TotalReadoutTime' for this file. " + sidecarMessage
            }));
        }
    }

    callback(issues);
};

function missingEvents(path, potentialEvents, events) {
    var hasEvent = false,
        isRest   = false;

    // check if is a rest file
    var pathParts = path.split('/');
    var filenameParts  = pathParts[pathParts.length - 1].split('_');
    for (var i = 0; i < filenameParts.length; i++) {
        var part = filenameParts[i];
        if (part.toLowerCase().indexOf('task') === 0 && part.toLowerCase().indexOf('rest') > -1) {
            isRest = true;
        }
    }

    // check for event file
    for (var i = 0; i < potentialEvents.length; i++) {
        var event = potentialEvents[i];
        if (events.indexOf(event) > -1) {
            hasEvent = true;
        }
    }

    return !isRest && path.endsWith('_bold.nii.gz') && !hasEvent;
}


/**
 * Potential Locations
 *
 * Takes the path to the lowest possible level of
 * a file that can be hierarchily positioned and
 * return a list of all possible locations for that
 * file.
 */
function potentialLocations(path) {
    var potentialPaths = [path];
    var pathComponents = path.split('/');
    var filenameComponents = pathComponents[pathComponents.length - 1].split("_");

    var sessionLevelComponentList = [],
        subjectLevelComponentList = [],
        topLevelComponentList = [],
        ses = null,
        sub = null;

    filenameComponents.forEach(function (filenameComponent) {
        if (filenameComponent.substring(0, 3) != "run") {
            sessionLevelComponentList.push(filenameComponent);
            if (filenameComponent.substring(0, 3) == "ses") {
                ses = filenameComponent;

            } else {
                subjectLevelComponentList.push(filenameComponent);
                if (filenameComponent.substring(0, 3) == "sub") {
                    sub = filenameComponent;
                } else {
                    topLevelComponentList.push(filenameComponent);
                }
            }
        }
    });

    if (ses) {
        var sessionLevelPath= "/" + sub + "/" + ses + "/" + sessionLevelComponentList.join("_");
        potentialPaths.push(sessionLevelPath)
    };

    var subjectLevelPath = "/" + sub + "/" + subjectLevelComponentList.join("_");
    potentialPaths.push(subjectLevelPath);

    var topLevelPath = "/" + topLevelComponentList.join("_");
    potentialPaths.push(topLevelPath);

    return potentialPaths;
}

/**
 * Generate Merged Sidecar Dictionary
 *
 * Takes an array of potential sidecards and a
 * master object dictionary of all JSON file
 * content and returns a merged dictionary
 * containing all values from the potential
 * sidecars.
 */
function generateMergedSidecarDict(potentialSidecars, jsonContents) {
    var mergedDictionary = {};
    for (var i = 0; i < potentialSidecars.length; i++) {
        var sidecarName = potentialSidecars[i];
        var jsonObject = jsonContents[sidecarName];
        if (jsonObject) {
            for (var key in jsonObject) {
                mergedDictionary[key] = jsonObject[key];
            }
        }
    }
    return mergedDictionary;
}