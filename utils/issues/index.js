var list  = require('./list');
var Issue = require('./issue');

module.exports = {

	/**
	 * List
	 *
	 * List of all validator issues.
	 */
	list: list,

	/**
	 * Issue
	 *
	 * Issue constructor
	 */
	Issue: Issue,

	/**
     * Format Issues
     */
    format: function (issues, options) {
        var errors = [], warnings = [];

        // sort alphabetically by relative path of files
        issues.sort(function (a,b) {
            var aPath = a.file ? a.file.relativePath : '';
            var bPath = b.file ? b.file.relativePath : '';
            return (aPath > bPath) ? 1 : ((bPath > aPath) ? -1 : 0);
        });

        // organize by issue code
        var categorized = {};
        for (var i = 0; i < issues.length; i++) {
            var issue = issues[i];
            if (!categorized[issue.code]) {
                categorized[issue.code] = list[issue.code];
                categorized[issue.code].files = [];
                categorized[issue.code].additionalFileCount = 0;
            }
            if (options.verbose || (categorized[issue.code].files.length < 10)) {
                categorized[issue.code].files.push(issue);
            } else {
                categorized[issue.code].additionalFileCount++;
            }
        }

        // organize by severity
        for (var key in categorized) {
            issue = categorized[key];
            issue.code = key;

            if (issue.severity === 'error') {
                errors.push(issue);
            } else if (issue.severity === 'warning' && !options.ignoreWarnings) {
                warnings.push(issue);
            }

        }

        return {errors: errors, warnings: warnings};
    }
};