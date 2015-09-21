var assert = require('assert');
var BIDS   = require('../validators/bids');

describe('BIDS', function(){

    it('should verify that NifTi files are compressed using gzip.', function () {
        var fileList = {
            '0': {
                name: 'gzipNifTi.nii.gz',
                path: '/Users/myuser/Desktop/ds114/gzipNifTi.nii.gz'
            },
            '1': {
                name: 'NifTi.nii',
                path: '/Users/myuser/Desktop/ds114/NifTi.nii'
            }
        };

        BIDS.fullTest(fileList, function (errors) {
            assert(errors && errors.length === 1);
        });
    });

});