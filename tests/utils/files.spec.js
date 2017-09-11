const assert = require('assert');
const after = require('mocha').after;
const utils = require('../../utils');

const setupMocks = () => {
    // Mock version of the File API for tests
    global.File = function MockFile(data, fileName, options) {
        assert(data.hasOwnProperty('length'));
        assert.equal(typeof data[0], 'string');
        this._data = data;
        this._options = options;
        this.name = fileName;
    };
};
const cleanupMocks = () => {
    delete global.File;
};

describe('files utils in nodejs', () => {
    describe('FileAPI', () => {
        it('should return a mock implementation', () => {
            let File = utils.files.FileAPI();
            assert(typeof File !== 'undefined');
            assert(File.name === 'NodeFile');
        });
    });
    describe('newFile', () => {
        it('creates a new File API object', () => {
            let file = utils.files.newFile('test-file');
            assert.equal(file.name, 'test-file');
        });
    });
});

describe('files utils in browsers', () => {
    before(setupMocks);
    after(cleanupMocks);
    describe('newFile', () => {
        it('creates a new File API object', () => {
            const test_file = utils.files.newFile('test-file');
            assert(File.prototype.isPrototypeOf(test_file));
        });
    });
});