var utils  = require('../utils');

var session = function singleSession(fileList) {
    var subjects = [];
    var issues = [];
    for (var key in fileList) {
        var file = fileList[key];
        var filename;
        var path = utils.files.relativePath(file);
        var subject;
        var match = path.match(/sub-(.*?)(?=\/)/);
        if (match === null) {
            continue;
        } else {
            subject = match[0];
        }
        if (typeof(subjects[subject]) === 'undefined') {
            subjects[subject] = [];
        }
        //path = path.split('/');
        filename = path.substring(path.match(subject).index + subject.length);
        filename = filename.replace(subject, '');
        subjects[subject].push(filename);
    }
      
    var subject_files = [];
    for (var subject in subjects) {
        subject_files = subject_files.concat(subjects[subject])
    }
    all_files = new Set(subject_files);

    all_files = Array.from(all_files);
    for (var subject in subjects) {
        for (var set_file in all_files) {
            if (subjects[subject].indexOf(all_files[set_file]) === -1) {
                issues.push(new utils.Issue({
                    file: all_files[set_file],
                    evidence: "Subject: " + subject + "; Missing file: " + all_files[set_file],
                    code: 39
                }));
            } 
        }
    }
    return issues;
};

module.exports = session;
