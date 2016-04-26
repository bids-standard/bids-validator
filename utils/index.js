require('./prototype');
var type    = require('./type');
var files   = require('./files');
var Issue   = require('./issue');
var issues  = require('./issues');
var summary = require('./summary');

module.exports = {
	files:   files,
	type:    type,
	Issue:   Issue,
	issues:  issues,
	summary: summary
};