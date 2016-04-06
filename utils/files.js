// dependencies -------------------------------------------------------------------

var nifti = require('nifti-js');
var Issue = require('./issue');

/**
 * If the current enviroment is server side
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
	readFile: readFile,
    readDir: readDir,
    readNiftiHeader: readNiftiHeader,
	generateTree: generateTree,
    relativePath: relativePath
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
        testFile(file, function (issue, stats) {
            if (issue) {
                callback(issue, null);
                return;
            }
            fs.readFile(file.path, 'utf8', function (err, data) {
                callback(null, data);
            });
        });
    } else {
    	var reader = new FileReader();
    	reader.onloadend = function (e) {
    		if (e.target.readyState == FileReader.DONE) {
                if (!e.target.result) {
                    callback(new Issue({code: 41, file: file}), null);
                    return;
                }
    			callback(null, e.target.result);
    		}
    	};
    	reader.readAsBinaryString(file);
    }
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
    if (fs) {
        files = getFiles(dir);
        filesObj = {};
        var str = dir.substr(dir.lastIndexOf('/') + 1) + '$';
        var subpath = dir.replace(new RegExp(str), '');
        for (var i = 0; i < files.length; i++) {
            filesObj[i] = {
                name: files[i].substr(files[i].lastIndexOf('/') + 1),
                path: files[i],
                relativePath: files[i].replace(subpath, '')
            };
        }
        callback(filesObj);
    } else {
        callback(dir);
    }
}

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.lstatSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
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
                }).on('error', function(err) {
                    callback(handleGunzipError(buffer, file));
                });

            fs.open(file.path, 'r', function(status, fd) {
                fs.read(fd, buffer, 0, bytesRead, 0, function(err, num) {
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
            callback({error: new Issue({code: 41, file: file})});
            return;
        }

        // file size is smaller than nifti header size
        if (file.size < 348) {
            callback({error: new Issue({code: 36, file: file})});
            return;
        }

        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
        fileReader = new FileReader();

        fileReader.onloadend = function (e) {
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
 * Generate Tree
 *
 * Takes a files object of a selected directory
 * and restructures them from a flat array to a
 * tree following the structure of the original
 * directory.
 */
function generateTree (files) {
	var pathList = {};
	var dirTree = {};

    // generate list of paths
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
        pathList[file.webkitRelativePath] = file;
    }

    // build path from list
    for (var key in pathList) {
    	var path = key;
    	var pathParts = path.split('/');
    	var subObj = dirTree;
    	for (var j = 0; j < pathParts.length; j++) {
    		var part = pathParts[j];
    		if (!subObj[part]) {
    			subObj[part] = j < pathParts.length - 1 ? {} : pathList[key];
    		}
    		subObj = subObj[part];
    	}
    }

	// convert dirTree to array structure
    function objToArr (obj) {
    	var arr = [];
    	for (var key in obj) {
    		if (obj[key].webkitRelativePath && obj[key].webkitRelativePath.length > 0) {
    			arr.push(obj[key]);
    		} else {
    			arr.push({name: key, type: 'folder', children: objToArr(obj[key])});
    		}
    	}
    	return arr;
	}

	dirTree = objToArr(dirTree);

    // return tree
    return dirTree;
}

/**
 * Relative Path
 *
 * Takes a file and returns the correct relative path property
 * base on the environment.
 */
function relativePath (file) {
    var relPath = (typeof window != 'undefined' ? file.webkitRelativePath : file.relativePath);

    // This hack uniforms relative paths for command line calls to 'BIDS-examples/ds001/' and 'BIDS-examples/ds001'
    if (relPath[0] !== '/') {
        var pathParts = relPath.split('/');
        relPath = '/' + pathParts.slice(1).join('/')
    }
    return relPath
}

/**
 * Test File
 *
 * Takes a file and callback and tests if it's viable for
 * reading. Callsback with an error and stats if it isn't
 * or null and stats if it is.
 */
function testFile (file, callback) {
    fs.lstat(file.path, function (statErr, stats) {
        fs.access(file.path, function (accessErr) {
            if (!accessErr) {
                callback(null, stats);
                return;
            } else {
                if (stats.isSymbolicLink()) {
                    callback(new Issue({code: 40, file: file}), stats);
                } else {
                    callback(new Issue({code: 41, file: file}), stats);
                }
            }
        });
    });
}

module.exports = fileUtils;