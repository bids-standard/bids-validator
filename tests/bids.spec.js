var assert = require('chai').assert
var validate = require('../index.js');
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


var suite = describe('BIDS example datasets ', function() {
    this.timeout(100000);

    before(function(done) {
        if (!fs.existsSync("tests/data/BIDS-examples-1.0.0-rc1u6/")) {
            console.log('downloading test data');
            response = request("GET", "http://github.com/INCF/BIDS-examples/archive/1.0.0-rc1u6.zip");
            if (!fs.existsSync("tests/data")) {
                fs.mkdirSync("tests/data");
            }
            fs.writeFileSync("tests/data/examples.zip", response.body);
            var zip = new AdmZip("tests/data/examples.zip");
            console.log('unzipping test data');
            zip.extractAllTo("tests/data/", true);
        }

        datasetDirectories = getDirectories("tests/data/BIDS-examples-1.0.0-rc1u6/");

        datasetDirectories.forEach(function testDataset(path){
            suite.addTest(new Test(path, function (isdone){
		    	var options = {ignoreNiftiHeaders: true};
                validate.BIDS("tests/data/BIDS-examples-1.0.0-rc1u6/" + path + "/", options, function (errors, warnings) {
                    assert.deepEqual(errors, []);
                    //assert.deepEqual(warnings, []);
                    isdone();
                });
            }));
        });
        done();
    });

    // we need to have at least one non-dynamic test
    it('validates path without trailing backslash', function(isdone) {
        var options = {ignoreNiftiHeaders: true};
        validate.BIDS("tests/data/BIDS-examples-1.0.0-rc1u5/ds001", options, function (errors, warnings) {
            assert.deepEqual(errors, []);
            //assert.deepEqual(warnings, []);
            isdone();
        });
    });

    // we need to have at least one non-dynamic test
    it('validates dataset with valid nifti headers', function(isdone) {
    	var options = {ignoreNiftiHeaders: false};
        validate.BIDS("tests/data/valid_headers", options, function (errors, warnings) {
            assert.deepEqual(errors, []);
            //assert.deepEqual(warnings, []);
            isdone();
        });
    });
});
