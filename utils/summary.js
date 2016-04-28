var files = require('./files');
var fs    = require('fs');
var async = require('async');

/**
 * Summmary
 *
 * Takes a full file list and returns a object of summary data.
 */
module.exports = function bval (fileList, callback) {
    var summary = {
        sessions: [],
        subjects: [],
        tasks:    [],
        modalities: [],
        totalFiles: Object.keys(fileList).length,
        size: 0
    };

    async.each(fileList, function (file, cb) {
        var path = file.relativePath ? file.relativePath : file.webkitRelativePath;

        // collect file stats
        if (typeof window !== 'undefined') {
            if (file.size) {summary.size += file.size;}
        } else {
            if (!file.stats) {file.stats = fs.lstatSync(file.path);}
            summary.size += file.stats.size;
        }

        // collect sessions subjects
        var checks = {
            'ses':  'sessions',
            'sub':  'subjects'
        };

        for (var checkKey in checks) {
            if (path && path.indexOf(checkKey + '-') > -1) {
                var item = path.slice(path.indexOf(checkKey + '-'));
                    item = item.slice(0, item.indexOf('/'));
                    if (item.indexOf('_') > -1) {item = item.slice(0, item.indexOf('_'));}
                    item = item.slice(checkKey.length + 1);
                if (summary[checks[checkKey]].indexOf(item) === -1) {summary[checks[checkKey]].push(item);}
            }
        }

        // collect modalities
        if (path && (path.endsWith('.nii') || path.endsWith('.nii.gz'))) {
            var pathParts = path.split('_');
            var suffix    = pathParts[pathParts.length -1];
                suffix    = suffix.slice(0, suffix.indexOf('.'));
            if (summary.modalities.indexOf(suffix) === -1) {summary.modalities.push(suffix);}
        }

        // collect tasks from json files
        if (path && path.endsWith('.json') && (path.indexOf('task') > -1)) {
            files.readFile(file, function (data) {
                var task;
                try {
                    task = JSON.parse(data).TaskName;
                }
                finally {
                    if (task && summary.tasks.indexOf(task) === -1) {
                        summary.tasks.push(task);
                    }
                    cb();
                }
            });
        } else {
            cb();
        }

    }, function () {
        summary.modalities = parseModalities(summary.modalities);
        callback(summary);
    });
};

/**
 * Parse Modalities
 *
 * Takes an array of modalities and looks for
 * groupings definined in 'modalityGroups' and
 * replaces any perfectly matched groupings with
 * the grouping object key.
 */
function parseModalities(modalities) {

    var modalityGroups = {
        fieldmap: [
            'magnitude1',
            'magnitude2',
            'phase1',
            'phase2'
        ]
    };

    for (var groupName in modalityGroups) {
        var group = modalityGroups[groupName];
        var match = true;
        for (var i = 0; i < group.length; i++) {
            if (modalities.indexOf(group[i]) === -1) {
                match = false;
            }
        }
        if (match) {
            modalities.push(groupName);
            for (var j = 0; j < group.length; j++) {
                modalities.splice(modalities.indexOf(group[j]), 1);
            }
        }
    }

    return modalities;
}
