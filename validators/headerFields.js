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
    var issues = [];
    issues = issues.concat(headerField(headers, 'dim'));
    issues = issues.concat(headerField(headers, 'pixdim'));
    return issues;
};

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
        var field_value;
        var file = headers[header_index][0];
        var filename;
        var header = headers[header_index][1];
        var match;
        var path = utils.files.relativePath(file);
        var run;
        var subject;

        if (field === 'dim') {
            field_value = header[field].slice(1, header[field][0]+1).toString();
        } else if (field === 'pixdim') {
            field_value = [];
            var pix_dim = header[field].slice(1,5);
            var units = header['xyzt_units'].slice(0,4);
            for (var i = 0; i < 4; i++) {
                field_value.push('' + pix_dim[i] + units[i]);
            }
            field_value = field_value.toString();
        } else {
            console.warn("Checks against header field: " + field + " are currently unsupported.");
            return;
        }

        if (!file || (typeof window != 'undefined' && !file.webkitRelativePath)) {
            continue;
        }

        if (!utils.type.isBIDS(path)) {
            continue;
        }
        //match the subject identifier up to the '/' in the full path to a file.
        match = path.match(/sub-(.*?)(?=\/)/);
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

        // generalize the run number so we can compare counts across all runs
        match = filename.match(/run-\d+/);
        if (match === null) {
            continue;
        } else {
            run = match[0];
        }

        filename = filename.substring(filename.match(run).index + run.length);
        filename = filename.replace(run, '<run>');

        if (!nifti_types.hasOwnProperty(filename)) {
            nifti_types[filename] = {};
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
        var nifti_type = nifti_types[nifti_key];
        var max_field_value = Object.keys(nifti_type)[0];
        for (var field_value_key in nifti_type) {
            field_value = nifti_type[field_value_key];
            if (field_value.count > nifti_type[max_field_value].count) {
                max_field_value = field_value_key;
            }
        }
        for (field_value_key in nifti_type) {
            field_value = nifti_type[field_value_key];
            if (max_field_value !== field_value_key && headerFieldCompare(max_field_value, field_value_key)) {
                for (var nifti_file_index in field_value.files) {
                    var nifti_file = field_value.files[nifti_file_index];
                    var evidence;
                    if (field === 'dim') {
                        evidence = " The most common set of dimensions is: " +
                                  max_field_value + "(voxels), This file has the dimensions: " +
                                  field_value_key + "(voxels)";
                    } else if (field === 'pixdim') {
                        evidence = " The most common resolution is: " +
                                  max_field_value.replace(/,/g, ' x ') + ", This file has the resolution: " +
                                  field_value_key.replace(/,/g, ' x ');
                    }
                        issues.push(new utils.Issue({
                        file: nifti_file,
                        evidence: evidence,
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
 * errors that cause resolutions to be slightly different. Returns true if
 * the two headers are signifigantly different
 */
function headerFieldCompare(header1, header2) {
    var hdr1 = header1.split(',');
    var hdr2 = header2.split(',');
    for (var i = 0; i < hdr1.length; i++) {
        var hdr1_val = Number(hdr1[i].match(/-?\d*\.?\d*/));
        var hdr2_val  = Number(hdr2[i].match(/-?\d*\.?\d*/));
        // Matching alphas with * will return '' on headers without units
        var hdr1_unit = hdr1[i].match(/[A-Za-z]*$/)[0];
        var hdr2_unit = hdr2[i].match(/[A-Za-z]*$/)[0];
        if (Math.abs(hdr1_val - hdr2_val) > .00001) {
            return true;
        }
        if (hdr1_unit !== hdr2_unit) {
            return true;
        }
    }
    return false;
}

module.exports = headerFields;

