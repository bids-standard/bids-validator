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


// var suite = describe('BIDS example datasets ', function() {
//     this.timeout(100000);

//     before(function(done) {
//         if (!fs.existsSync("tests/data/BIDS-examples-1.0.0-rc1u5/")) {
//             console.log('downloading test data');
//             response = request("GET", "http://github.com/INCF/BIDS-examples/archive/1.0.0-rc1u5.zip");
//             if (!fs.existsSync("tests/data")) {
//                 fs.mkdirSync("tests/data");
//             }
//             fs.writeFileSync("tests/data/examples.zip", response.body);
//             var zip = new AdmZip("tests/data/examples.zip");
//             console.log('unzipping test data');
//             zip.extractAllTo("tests/data/", true);
//         }

//         datasetDirectories = getDirectories("tests/data/BIDS-examples-1.0.0-rc1u5/");

//         datasetDirectories.forEach(function testDataset(path){
//             suite.addTest(new Test(path, function (isdone){
//                 validate.BIDS("tests/data/BIDS-examples-1.0.0-rc1u5/" + path + "/", function (errors, warnings) {
//                     assert.deepEqual(errors, []);
//                     //assert.deepEqual(warnings, []);
//                     isdone();
//                 });
//             }));
//         });
//         done();
//     });

//     // we need to have at least one non-dynamic test
//     return it('validates path without trailing backslash', function(isdone) {
//         validate.BIDS("tests/data/BIDS-examples-1.0.0-rc1u5/ds001", function (errors, warnings) {
//             assert.deepEqual(errors, []);
//             //assert.deepEqual(warnings, []);
//             isdone();
//         });
//     });
// });
