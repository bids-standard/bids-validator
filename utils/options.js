module.exports = {

	/**
	 * Parse
	 */
	parse: function (options) {
		options = options ? options : {};
        return {
            ignoreWarnings:     options.ignoreWarnings     ? true : false,
            ignoreNiftiHeaders: options.ignoreNiftiHeaders ? true : false,
            verbose:            options.verbose            ? true : false
        };
    }

};