// dependencies -------------------------------------------------------------------

/**
 * If the current enviroment is server side
 * nodejs/iojs import fs.
 */
if (typeof window === 'undefined') {
    var fs = require('fs');
}

// public API ---------------------------------------------------------------------

var fileUtils = {
	read: read,
    readDir: readDir,
	generateTree: generateTree
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
function read (file, callback) {
    if (fs) {
        fs.readFile(file.path, 'utf8', function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(data);
            }
        });
    } else {
    	var reader = new FileReader();
    	reader.onloadend = function (e) {
    		if (e.target.readyState == FileReader.DONE) {
    			callback(e.target.result);
    		}
    	};
    	reader.readAsBinaryString(file);
    }
}

/**
 * Read Directory
 *
 * Takes a path to a directory and returns an
 * array containing all of the files to a callback.
 * Used to input and organize files in node, in a
 * similar structure to how chrome reads a
 * directory.
 */
function readDir (path, callback) {
    if (fs) {
        files = getFiles(path);
        filesObj = {};
        for (var i = 0; i < files.length; i++) {
            filesObj[i] = {name: files[i].substr(files[i].lastIndexOf('/') + 1), path: files[i]};
        }
        callback(filesObj);
    }
}

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
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

module.exports = fileUtils;