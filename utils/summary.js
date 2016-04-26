/**
 * Summmary
 *
 * Takes a full file list and returns a object of summary data.
 */
module.exports = function bval (fileList) {
    var summary = {
        sessions: [],
        subjects: [],
        runs:     [],
        tasks:    [],
        modalities: []
    };

    for (var fileKey in fileList) {
        var file = fileList[fileKey];
        var path = file.relativePath;

        var checks = {
            'ses':  'sessions',
            'sub':  'subjects',
            'run':  'runs',
            'task': 'tasks'
        };

        for (var checkKey in checks) {
            // var check = checks[i];
            if (path.indexOf(checkKey + '-') > -1) {
                var task = path.slice(path.indexOf(checkKey + '-'));
                    task = task.slice(0, task.indexOf('/'));
                    if (task.indexOf('_') > -1) {task = task.slice(0, task.indexOf('_'));}
                    task = task.slice(checkKey.length + 1);
                if (summary[checks[checkKey]].indexOf(task) === -1) {summary[checks[checkKey]].push(task);}
            }
        }

        if (path.endsWith('.nii') || path.endsWith('.nii.gz')) {
            var pathParts = path.split('_');
            var suffix    = pathParts[pathParts.length -1];
                suffix    = suffix.slice(0, suffix.indexOf('.'));
            if (summary.modalities.indexOf(suffix) === -1) {summary.modalities.push(suffix);}
        }

    }

    // console.log(summary);
};
