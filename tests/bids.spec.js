var assert = require('chai').assert
var validate = require('../index.js');
var BIDS   = require('../validators/bids');
var request = require('sync-request');
var fs = require('fs');
var AdmZip = require('adm-zip');
var path = require('path');
var Test = require("mocha/lib/test");

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}



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
var suite = describe('BIDS examples - ', function() {
    this.timeout(100000);

    before(function() {
        if (!fs.existsSync("tests/data")) {
            console.log('downloading test data')
            response = request("GET", "http://github.com/INCF/BIDS-examples/archive/1.0.0-rc1.zip")
            fs.mkdirSync("tests/data")
            fs.writeFileSync("tests/data/examples.zip", response.body)
            var zip = new AdmZip("tests/data/examples.zip");
            console.log('unzipping test data')
            zip.extractAllTo("tests/data/", true);
        }

        datasetDirectories = getDirectories("tests/data/BIDS-examples-1.0.0-rc1/")

        datasetDirectories.forEach(function testDataset(path){
            suite.addTest(new Test(path, function (){
                validate.BIDS("tests/data/BIDS-examples-1.0.0-rc1/" + path, function (errors, warnings) {
                    assert.equal(errors, []);
                    assert.equal(warnings, []);
                });
            }));
        });
    });

    return it('should be ok', function() {
        return 0;
    });
});