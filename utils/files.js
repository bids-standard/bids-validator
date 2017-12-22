// dependencies -------------------------------------------------------------------

var nifti = require('nifti-js');
var Issue = require('./issues').Issue;
var ignore = require('ignore');
var path = require('path');

/**
 * If the current environment is server side
 * nodejs/iojs import fs.
 */
if (typeof window === 'undefined') {
    var fs = require('fs');
    var zlib = require('zlib');
} else {
    var pako = require('pako');
}

// public API ---------------------------------------------------------------------

var fileUtils = {
    FileAPI: FileAPI,
    newFile: newFile,
    readFile: readFile,
    readDir: readDir,
    readNiftiHeader: readNiftiHeader
};

// implementations ----------------------------------------------------------------

/**
 * Read
 *
 * A helper method for reading file contents.
 * Takes a file object and a callback and calls
 * the callback with the binary contents of the
 * file as the only argument.
 *
 * In the browser the file should be a file object.
 * In node the file should be a path to a file.
 *
 */
function readFile (file, callback) {
    if (fs) {
        testFile(file, function (issue) {
            if (issue) {
                process.nextTick(function() { callback(issue, null); });
                return;
            }
            fs.readFile(file.path, 'utf8', function (err, data) {
                process.nextTick(function() { callback(null, data); });
            });
        });
    } else {
        var reader = new FileReader();
        reader.onloadend = function (e) {
            if (e.target.readyState == FileReader.DONE) {
                if (!e.target.result) {
                    callback(new Issue({code: 44, file: file}), null);
                    return;
                }
                callback(null, e.target.result);
            }
        };
        reader.readAsBinaryString(file);
    }
}

function addBIDSIgnore(dir) {
    var ig = ignore().add('.bidsignore');
    var bidsIgnoreFileObj = null;
    var ready = false;
    if (fs) {
        var path = dir + "/.bidsignore";
        if (fs.existsSync(path)){
            bidsIgnoreFileObj = {path: path};
        }
    } else {
        for (var i = 0; i < dir.length; i++) {
            var fileObj = dir[i];
            var relativePath = harmonizeRelativePath(fileObj.webkitRelativePath);
            if (relativePath === "/.bidsignore") {
                bidsIgnoreFileObj = fileObj;
                break;
            }
        }
    }
    if (bidsIgnoreFileObj) {
        readFile(bidsIgnoreFileObj, function (issue, content) {
            ig = ig.add(content);
            ready = true;
        });

        //TODO: rewrite this in an asynchronous way
        var check = function () {
            if (ready === true) {
                return;
            }
            setTimeout(check, 100);
        };
        check();
    }

    return ig;
}

/**
 * Read Directory
 *
 * In node it takes a path to a directory and returns
 * an array containing all of the files to a callback.
 * Used to input and organize files in node, in a
 * similar structure to how chrome reads a directory.
 * In the browser it simply passes the file dir
 * object to the callback.
 */
function readDir (dir, callback) {
    var filesObj = {};
    var filesList = [];
    var ig = addBIDSIgnore(dir);

    if (fs) {
        filesList = preprocessNode(dir, ig);
    } else {
        filesList = preprocessBrowser(dir, ig);
    }
    // converting array to object
    for (var j = 0; j < filesList.length; j++) {
        filesObj[j] = filesList[j];
    }
    callback(filesObj);
}

/**
 * Preprocess file objects from a browser
 *
 * 1. Filters out ignored files and folder.
 * 2. Adds 'relativePath' field of each file object.
 */
function preprocessBrowser(filesObj, ig) {
    var filesList = [];
    for (var i = 0; i < filesObj.length; i++) {
        var fileObj = filesObj[i];
        fileObj.relativePath = harmonizeRelativePath(fileObj.webkitRelativePath);
        if (ig.ignores(path.relative('/', fileObj.relativePath))) {
            continue;
        }
        filesList.push(fileObj);
    }
    return filesList;
}

/**
 * Preprocess directory path from a Node CLI
 *
 * 1. Recursively travers the directory tree
 * 2. Filters out ignored files and folder.
 * 3. Harmonizes the 'relativePath' field
 */
function preprocessNode(dir, ig) {
    var str = dir.substr(dir.lastIndexOf('/') + 1) + '$';
    var rootpath = dir.replace(new RegExp(str), '');
    return getFiles(dir, [], rootpath, ig);
}

/**
 * Recursive helper function for 'preprocessNode'
 */
function getFiles(dir, files_, rootpath, ig){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
        var fullPath = dir + '/' + files[i];
        var relativePath = fullPath.replace(rootpath, '');
        relativePath = harmonizeRelativePath(relativePath);
        if (ig.ignores(path.relative('/', relativePath))) {
            continue;
        }
        var fileName = files[i];

        var fileObj = {
            name: fileName,
            path: fullPath,
            relativePath: relativePath
        };

        if (fs.lstatSync(fullPath).isDirectory()) {
            getFiles(fullPath, files_, rootpath, ig);
        } else {
            files_.push(fileObj);
        }
    }
    return files_;
}


/**
 * Read Nifti Header
 *
 * Takes a files and returns a json parsed nifti
 * header without reading any extra bytes.
 */
function readNiftiHeader (file, callback) {
    var bytesRead = 500;

    if (fs) {
        testFile(file, function (issue, stats) {
            file.stats = stats;
            if (issue) {
                callback({error: issue});
                return;
            }
            if (stats.size < 348) {
                callback({error: new Issue({code: 36, file: file})});
                return;
            }

            var buffer = new Buffer(bytesRead);

            var decompressStream = zlib.createGunzip()
                .on('data', function (chunk) {
                    callback(parseNIfTIHeader(chunk, file));
                    decompressStream.pause();
                }).on('error', function() {
                    callback(handleGunzipError(buffer, file));
                });

            fs.open(file.path, 'r', function(status, fd) {
                fs.read(fd, buffer, 0, bytesRead, 0, function() {
                    if (file.name.endsWith('.nii')) {
                        callback(parseNIfTIHeader(buffer, file));
                    } else {
                        decompressStream.write(buffer);
                    }
                });
            });
        });
    } else {

        if (file.size == 0) {
            callback({error: new Issue({code: 44, file: file})});
            return;
        }

        // file size is smaller than nifti header size
        if (file.size < 348) {
            callback({error: new Issue({code: 36, file: file})});
            return;
        }

        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
        fileReader = new FileReader();

        fileReader.onloadend = function () {
            var buffer = new Uint8Array(fileReader.result);
            var unzipped;

            if (file.name.endsWith('.nii')) {
                unzipped = buffer;
            } else {
                try {
                    unzipped = pako.inflate(buffer);
                }
                catch (err) {
                    callback(handleGunzipError(buffer, file));
                    return;
                }
            }

            callback(parseNIfTIHeader(unzipped, file));
        };

        fileReader.readAsArrayBuffer(blobSlice.call(file, 0, bytesRead));
    }
}

/**
 * Handle Gunzip Error (private)
 *
 * Used when unzipping fails. Tests if file was
 * actually gzipped to begin with by trying to parse
 * the original header.
 */
function handleGunzipError (buffer, file) {
    try {
        nifti.parseNIfTIHeader(buffer);
    }
    catch (err) {
        // file is unreadable
        return {error: new Issue({code: 26, file: file})};
    }
    // file was not originally gzipped
    return {error: new Issue({code: 28, file: file})};
}

/**
 * Parse NIfTI Header (private)
 *
 * Attempts to parse a header buffer with
 * nifti-js and handles errors.
 */
function parseNIfTIHeader (buffer, file) {
    var header;
    try {
        header = nifti.parseNIfTIHeader(buffer);
    }
    catch (err) {
        // file is unreadable
        return {error: new Issue({code: 26, file: file})};
    }
    // file was not originally gzipped
    return header;
}

/**
 * Relative Path
 *
 * Takes a file and returns the correct relative path property
 * base on the environment.
 */
function harmonizeRelativePath(path) {

    // This hack uniforms relative paths for command line calls to 'BIDS-examples/ds001/' and 'BIDS-examples/ds001'
    if (path[0] !== '/') {
        var pathParts = path.split('/');
        path = '/' + pathParts.slice(1).join('/');
    }
    return path;
}

/**
 * Test File
 *
 * Takes a file and callback and tests if it's viable for
 * reading. Calls back with an error and stats if it isn't
 * or null and stats if it is.
 */
function testFile (file, callback) {
    fs.stat(file.path, function (statErr, stats) {
        if (statErr) {
            fs.lstat(file.path, function (lstatErr, lstats) {
                if (lstatErr) {
                    callback(new Issue({code: 44, file: file}), stats);
                } else if (lstats && lstats.isSymbolicLink()) {
                    callback(new Issue({code: 43, file: file}), stats);
                } else {
                    callback(new Issue({code: 44, file: file}), stats);
                }
            });
        } else {
            fs.access(file.path, function (accessErr) {
                if (!accessErr) {
                    process.nextTick(function() { callback(null, stats); });
                } else {
                    process.nextTick(function() { callback(new Issue({code: 44, file: file}), stats); });
                }
            });
        }
    });
}

/**
 * Simulates some of the browser File API interface.
 * https://developer.mozilla.org/en-US/docs/Web/API/File
 * 
 * @param {string[]} parts - file contents as bytes
 * @param {string} filename - filename without path info
 * @param {Object} properties - unused Blob properties
 */
function NodeFile(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.properties = properties;
    this.size = parts.reduce(function (a, val) {
        return a + val.length;
    }, 0);
    // Unknown defacto mime-type
    this.type = 'application/octet-stream';
    this.lastModified = 0;
}

/**
 * Return a either a mock or real FileAPI if one is available
 */
function FileAPI() {
    return typeof File === 'undefined' ? NodeFile: File;
}

/**
 * New File
 *
 * Creates an empty File object
 * 
 * @param {string} filename - the filename without path info
 */
function newFile(filename) {
    var File = FileAPI();
    return new File([''], filename);
}

module.exports = fileUtils;
