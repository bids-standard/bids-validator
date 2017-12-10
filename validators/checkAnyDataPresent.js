var utils = require('../utils');
var Issue = utils.issues.Issue;

function getFolderSubjects(fileList) {
    var folderSubjects = [];
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
    return folderSubjects;
}

/**
 * checkAnyDataPresent
 *
 * Takes a list of files and participants with valid data. Checks if they match.
 */
var checkAnyDataPresent = function checkAnyDataPresent(fileList, summarySubjects) {
    var issues = [];
    var folderSubjects = getFolderSubjects(fileList);

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
