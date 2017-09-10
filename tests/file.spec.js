const assert = require('assert');
const after = require('mocha').after;
const utils = require('../utils');

describe('File', () => {
    describe('newFile without File API', () => {
        it('creates a new file', function () {
            let file = utils.files.newFile('test-file');
            assert.equal(file, 'test-file');
        });
    });
    describe('newFile with File API', () => {
        before(() => {
            // Mock version of the File API
            global.File = function File(data, fileName, options) {
                assert(data.hasOwnProperty('length'));
                assert.equal(typeof data[0], 'string');
                this._data = data;
                this._options = options;
                this.name = fileName;
            };
        });
        after(() => {
            delete global.File;
        });
        it('creates a new file with the File API', function () {
            const test_file = utils.files.newFile('test-file');
            assert(File.prototype.isPrototypeOf(test_file));
        });
    });
});