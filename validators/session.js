var utils  = require('../utils');

/**
 * session
 *
 * Takes a list of files and creates a set of file names that occur in subject
 * directories. Then generates a warning if a given subject is missing any 
 * files from the set.
 */
var session = function missingSessionFiles(fileList) {
    var subjects = [];
    var issues = [];
    for (var key in fileList) {
        var file = fileList[key];
        var filename;
        
        if (!file || (typeof window != 'undefined' && !file.webkitRelativePath)) {
            continue;
        }
         
        var path = utils.files.relativePath(file);
        var subject;
        //match the subject identifier up to the '/' in the full path to a file.
        var match = path.match(/sub-(.*?)(?=\/)/);
        if (match === null) {
            continue;
        } else {
            subject = match[0];
        }
        // initialize an empty array if we haven't seen this subject before
        if (typeof(subjects[subject]) === 'undefined') {
            subjects[subject] = [];
        }
        // files are prepended with subject name, the following two commands 
        // remove the subject from the file name to allow filenames to be more
        // easily compared
        filename = path.substring(path.match(subject).index + subject.length);
        filename = filename.replace(subject, '<sub>');
        subjects[subject].push(filename);
    }
      
    var subject_files = [];
    for (var subject in subjects) {
        subject_files = subject_files.concat(subjects[subject])
    }
    // Converting to a Set removes all duplicates
    all_files = new Set(subject_files);

    // Converting it back to an array for easy iteration
    all_files = Array.from(all_files);
    for (var subject in subjects) {
        for (var set_file in all_files) {
            if (subjects[subject].indexOf(all_files[set_file]) === -1) {
                filename = all_files[set_file].replace('<sub>', subject);
                file.relativePath = '/' + subject + filename;
                issues.push(new utils.Issue({
                    file: file,
                    evidence: "Subject: " + subject + "; Missing file: " + filename,
                    code: 38
                }));
            } 
        }
    }
    return issues;
};

module.exports = session;
