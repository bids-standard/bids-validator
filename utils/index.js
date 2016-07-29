require('./prototype');
var array  = require('./array');
var files  = require('./files');
var Issue  = require('./issue');
var issues = require('./issues');
var type   = require('./type');

module.exports = {
	array:  array,
	files:  files,
	Issue:  Issue,
	issues: issues,
	type:   type,
};