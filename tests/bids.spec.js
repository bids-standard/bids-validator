var assert = require('chai').assert
var validate = require('../index.js');
var request = require('sync-request');
var fs = require('fs');
var AdmZip = require('adm-zip');
var path = require('path');
var Test = require("mocha/lib/test");
var test_version = "1.0.0-rc3u4"

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

missing_session_files = ['ds006', 'ds007', 'ds008', 'ds051', 'ds052', 'ds105', 'ds108', 'ds109', 'ds113b']

var suite = describe('BIDS example datasets ', function() {
    this.timeout(100000);

    before(function(done) {
        if (!fs.existsSync("tests/data/BIDS-examples-" + test_version + "/")) {
            console.log('downloading test data');
            response = request("GET", "http://github.com/INCF/BIDS-examples/archive/" + test_version + ".zip");
            if (!fs.existsSync("tests/data")) {
                fs.mkdirSync("tests/data");
            }
            fs.writeFileSync("tests/data/examples.zip", response.body);
            var zip = new AdmZip("tests/data/examples.zip");
            console.log('unzipping test data');
            zip.extractAllTo("tests/data/", true);
        }

        datasetDirectories = getDirectories("tests/data/BIDS-examples-" + test_version + "/");

        datasetDirectories.forEach(function testDataset(path){
            suite.addTest(new Test(path, function (isdone){
		    	var options = {ignoreNiftiHeaders: true};
                validate.BIDS("tests/data/BIDS-examples-" + test_version + "/" + path + "/", options, function (errors, warnings) {
                    assert.deepEqual(errors, []);
                    if (missing_session_files.indexOf(path) === -1) {
                        //pass
                    } else {
                        session_flag = false;
                        for (var warning in warnings) {
                            if (warnings[warning]['code'] === '39') {
                                session_flag = true;
                            }
                        }
                        assert.deepEqual(session_flag, true);
                    }
                    isdone();
                });
            }));
        });
        done();
    });

    // we need to have at least one non-dynamic test
    it('validates path without trailing backslash', function(isdone) {
        var options = {ignoreNiftiHeaders: true};
        validate.BIDS("tests/data/BIDS-examples-" + test_version + "/ds001", options, function (errors, warnings) {
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
