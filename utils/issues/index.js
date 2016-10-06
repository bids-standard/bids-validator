var list      = require('./list');
var Issue     = require('./issue');
var config    = require('../config');

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
     * Filter Fieldmaps
     *
     * Remove fieldmap related warnings if no fieldmaps
     * are present.
     */
    filterFieldMaps: function (warnings, summary) {
        if (summary.modalities.indexOf("fieldmap") < 0) {
            var filteredWarnings = [];
            var fieldmapRelatedCodes = ["6", "7", "8", "9"];
            for (var i = 0; i < warnings.length; i++) {
                if (fieldmapRelatedCodes.indexOf(warnings[i].code) < 0) {
                    filteredWarnings.push(warnings[i]);
                }
            }
            warnings = filteredWarnings;
        }
        return warnings
    },

	/**
     * Format Issues
     */
    format: function (issues, summary, options) {
        var errors = [], warnings = [];

        // sort alphabetically by relative path of files
        issues.sort(function (a,b) {
            var aPath = a.file ? a.file.relativePath : '';
            var bPath = b.file ? b.file.relativePath : '';
            return (aPath > bPath) ? 1 : ((bPath > aPath) ? -1 : 0);
        });

        // organize by issue code
        var categorized = {};
        var codes = []
        for (var i = 0; i < issues.length; i++) {
            var issue = issues[i];

            if (issue.file && config.ignoredFile(options.config, issue.file.relativePath)) {
                continue;
            }

            if (!categorized[issue.code]) {
                codes.push(issue.key);
                codes.push(issue.code);
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

        var severityMap = config.interpret(codes, options.config);

        // organize by severity
        for (var key in categorized) {
            issue = categorized[key];
            issue.code = key;

            if (severityMap.hasOwnProperty(issue.code)) {
                issue.severity = severityMap[issue.code];
            }

            if (severityMap.hasOwnProperty(issue.key)) {
                issue.severity = severityMap[issue.key];
            }

            if (issue.severity === 'error') {
                errors.push(issue);
            } else if (issue.severity === 'warning' && !options.ignoreWarnings) {
                warnings.push(issue);
            }

        }

        warnings = this.filterFieldMaps(warnings, summary);

        return {errors: errors, warnings: warnings};
    }
};