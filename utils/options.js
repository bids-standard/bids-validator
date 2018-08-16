var files  = require('./files');
var json   = require('./json');

module.exports = {

    /**
     * Parse
     */
    parse: function (options, callback) {
        options = options ? options : {};
        options = {
            ignoreWarnings:     options.ignoreWarnings     ? true : false,
            ignoreNiftiHeaders: options.ignoreNiftiHeaders ? true : false,
            verbose:            options.verbose            ? true : false,
            bep006:             options.bep006             ? true : false,
            bep010:             options.bep010             ? true: false,
            config:             options.config             ? options.config : {}
        };
        if (options.config && typeof options.config !== 'boolean') {
            this.parseConfig(options.config, function (issues, config) {
                options.config = config;
                callback(issues, options);
            });
        } else {
            callback(null, options);
        }
    },

    /**
     * Load Config
     */
    loadConfig: function (config, callback) {
        if (typeof config === 'string') {
            // load file
            files.readFile({path: config}, function (issue, contents) {
                if (issue) {
                    callback([issue], {path: config}, null);
                } else {
                    callback(null, {path: config}, contents);
                }
            });
        } else if (typeof config === 'object') {
            callback(null, {path: 'config'}, JSON.stringify(config));
        }
    },

    /**
     * Parse Config
     */
    parseConfig: function (config, callback) {
        this.loadConfig(config, function (issues, file, contents) {
            if (issues) {
                callback(issues, null);
            } else {
                json.parse(file, contents, function (issues, jsObj) {
                    if (issues && issues.length > 0) {
                        callback(issues, null);
                    } else {
                        var parsed = {
                            "ignore":       jsObj.ignore       ? jsObj.ignore       : [],
                            "warn":         jsObj.warn         ? jsObj.warn         : [],
                            "error":        jsObj.error        ? jsObj.error        : [],
                            "ignoredFiles": jsObj.ignoredFiles ? jsObj.ignoredFiles : []
                        };
                        callback(null, parsed);
                    }
                });
            }
        });
    }

};
