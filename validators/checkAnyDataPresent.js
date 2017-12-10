var utils = require('../utils');
var Issue = utils.issues.Issue;

/**
 * session
 *
 * Takes a list of files and creates a set of file names that occur in subject
 * directories. Then generates a warning if a given subject is missing any
 * files from the set.
 */
var checkAnyDataPresent = function checkAnyDataPresent(fileList, summarySubjects) {
    var folderSubjects = [];
    var issues = [];
    for (var key in fileList) {
        var file = fileList[key];
        var match = file.relativePath.match(/sub-(.*?)(?=\/)/);
        if (match) {
            var subject = match[1];
            if (folderSubjects.indexOf(subject) == -1) {
                folderSubjects.push(subject);
            }
        }
    }

    var subjectsWithoutAnyValidData = folderSubjects.filter(function (i) {
        return summarySubjects.indexOf(i) < 0;
    });

    for (var i = 0; i < subjectsWithoutAnyValidData.length; i++) {
        var missingSubject = subjectsWithoutAnyValidData[i];
        var subFolder = "/sub-" + missingSubject;
        issues.push(new Issue({
            file: {
                relativePath: subFolder,
                webkitRelativePath: subFolder,
                name: subFolder,
                path: subFolder
            },
            reason: "No BIDS compatible data found for subject " + missingSubject,
            code: 67
        }));
    }
    return issues;
};

module.exports = checkAnyDataPresent;
