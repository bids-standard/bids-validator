var utils  = require('../utils');

/**
 * dimensions and resolution
 *
 * Checks dimensions and resolution for x, y, z, and time across subjects to 
 * ensure they are consistent. 
 * 
 * The fields we are interested in are all arrays and we are only looking at
 * the first for values in those arrays. To handle single values or longer 
 * arrays more arguments will need to be added to headerField.
 */

var headerFields = function headerFields(headers) {
    var header_keys = ['dim', 'pixdim', 'xyzt_units']
    var issues = [];
    for (header_key_index in header_keys) {
        issues = issues.concat(headerField(headers, header_keys[header_key_index]));
    }
    
    return issues;
}

/**
 * Key to headerField working is the fact that we take and array of values 
 * from the nifti header and convert it to a string. This string is used to 
 * comapre the header field value against other header field values and is used
 * as an attribute in the object nifti_types. Nifti types refers to the 
 * different types of nifti files we are comparing across subjects. Only the 
 * dimensionality of similar anatomy/funtional/dwi headers are being compared.
 */

var headerField = function headerField(headers, field) {
    var nifti_types = {};
    var issues = [];
    for (var header_index in headers) {
        var file = headers[header_index][0];
        var header = headers[header_index][1];
        var field_value = header[field].slice(0,4).toString();
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
            nifti_types[filename][field_value] = {'count': 1, 'files': [file]};
        } else {
            if (!nifti_types[filename].hasOwnProperty(field_value)) {
                nifti_types[filename][field_value] = {'count': 1, 'files': [file]};
            } else {
                nifti_types[filename][field_value].count += 1;
                nifti_types[filename][field_value].files.push(file);
            }
        }
    }
    
    for (var nifti_key in nifti_types) {
        nifti_type = nifti_types[nifti_key];
        var max_field_value = Object.keys(nifti_type)[0];
        for (var field_value_key in nifti_type) {
            var field_value = nifti_type[field_value_key];
            if (field_value.count > nifti_type[max_field_value].count) {
                max_field_value = field_value_key;
            }
        }
        for (var field_value_key in nifti_type) {
            if (max_field_value !== field_value_key && headerFieldCompare(max_field_value, field_value_key)) {
                for (var nifti_file_index in field_value.files) {
                    var nifti_file = field_value.files[nifti_file_index];
                    issues.push(new utils.Issue({
                        file: nifti_file,
                        evidence: "For the field " + field + 
                                  " The most common values is: " + 
                                  max_field_value + " This file has the value: " + 
                                  field_value_key,
                        code: 39
                    }));
                }
            }
        }
    }
    return issues; 
};

/**
 * if elements of the two arrays differ by less than one we won't raise a 
 * warning about them. There are a large number of floating point rounding
 * errors that cause resolutions to be slightly different.
 */
function headerFieldCompare(header1, header2) {
    header1 = header1.split(',').map(Number);
    header2 = header2.split(',').map(Number);
    for (var i in header1) {
        if (Math.abs(header1[i] - header2[i]) >= 1) {
            return true;
        }
    }
    return false;
}

module.exports = headerFields;
