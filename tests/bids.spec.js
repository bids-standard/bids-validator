/**
 *  Copyright 2015 Zachary Michael - Squishmedia
 *
 *  This file is part of BIDS-Validator.
 *
 *  BIDS-Validator is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  BIDS-Validator is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with BIDS-Validator.  If not, see <http://www.gnu.org/licenses/>
 **/

var assert   = require('assert');
var validate = require('../index');

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

        validate.BIDS(fileList, function (errors) {
            assert(errors && errors.length === 1);
        });
    });

});