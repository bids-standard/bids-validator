var utils  = require('../utils');

/**
 * dimensions and resolution
 *
 * Checks dimensions and resolution for x, y, z, and time across subjects to 
 * ensure they are consistent. 
 * 
 */
var dimRes = function dimRes(headers) {
    var nifti_types = {};
    var issues = [];
    for (var header_index in headers) {
        var file = headers[header_index][0];
        var header = headers[header_index][1];
        var dimension = header.dim.toString();
        var filename;
        
        if (!file || (typeof window != 'undefined' && !file.webkitRelativePath)) {
            continue;
        }
         
        var path = utils.files.relativePath(file);
        if (!utils.type.isBIDS(path)) {
            continue;
        }
        var subject;
        //match the subject identifier up to the '/' in the full path to a file.
        var match = path.match(/sub-(.*?)(?=\/)/);
        if (match === null) {
            continue;
        } else {
            subject = match[0];
        }
        // files are prepended with subject name, the following two commands 
        // remove the subject from the file name to allow filenames to be more
        // easily compared
        filename = path.substring(path.match(subject).index + subject.length);
        filename = filename.replace(subject, '<sub>');
        if (!nifti_types.hasOwnProperty(filename)) {
            nifti_types[filename] = {}
            nifti_types[filename][dimension] = {'count': 1, 'files': [file]};
        } else {
            if (!nifti_types[filename].hasOwnProperty(dimension)) {
                nifti_types[filename][dimension] = {'count': 1, 'files': [file]};
            } else {
                nifti_types[filename][dimension].count += 1;
                nifti_types[filename][dimension].files.push(file);
            }
        }
    }
    
    for (var nifti_key in nifti_types) {
        nifti_type = nifti_types[nifti_key];
        var max_dimension = Object.keys(nifti_type)[0];
        for (var dimension_key in nifti_type) {
            var dimension = nifti_type[dimension_key];
            if (dimension.count > nifti_type[max_dimension].count) {
                max_dimension = dimension_key;
            }
        }
        for (var dimension_key in nifti_type) {
            if (max_dimension !== dimension_key) {
                issues.push(new utils.Issue({
                    file: dimension.files,
                    evidence: "Mode dimentionality: " + max_dimension + " This file has: " + dimension_key,
                    code: 39
                }));
            }
        }
    }
    return issues; 
};

module.exports = dimRes;
