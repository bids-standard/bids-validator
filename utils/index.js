require('./prototype');
var type  = require('./type');
var files = require('./files');
var Issue = require('./issue');

module.exports = {
	files: files,
	type: type,
	Issue: Issue
};