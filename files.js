// public API ---------------------------------------------------------------------

var fileUtils = {
	read: read,
	generateTree: generateTree
};

exports = fileUtils;

// implementations ----------------------------------------------------------------

/**
 * Read
 *
 * A helper method for reading file contents.
 * Takes a file object and a callback and calls
 * the callback with the binary contents of the
 * file as the only argument.
 */
function read (file, callback) {
	var reader = new FileReader();
	reader.onloadend = function (e) {
		if (e.target.readyState == FileReader.DONE) {
			callback(e.target.result);
		}
	};
	reader.readAsBinaryString(file);
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