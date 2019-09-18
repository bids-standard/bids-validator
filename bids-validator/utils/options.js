var files = require('./files')
var json = require('./json')

module.exports = {
  /**
   * Parse
   */
  parse: function(options, callback) {
    options = options ? options : {}
    options = {
      ignoreWarnings: Boolean(options.ignoreWarnings),
      ignoreNiftiHeaders: Boolean(options.ignoreNiftiHeaders),
      ignoreSymlinks: Boolean(options.ignoreSymlinks),
      verbose: Boolean(options.verbose),
      gitTreeMode: Boolean(options.gitTreeMode),
      gitRef: options.gitRef || 'HEAD',
      config: options.config || {},
    }
    if (options.config && typeof options.config !== 'boolean') {
      this.parseConfig(options.config, function(issues, config) {
        options.config = config
        callback(issues, options)
      })
    } else {
      callback(null, options)
    }
  },

  /**
   * Load Config
   */
  loadConfig: function(config, callback) {
    if (typeof config === 'string') {
      // load file
      files
        .readFile({ path: config })
        .then(contents => {
          callback(null, { path: config }, contents)
        })
        .catch(issue => {
          callback([issue], { path: config }, null)
        })
    } else if (typeof config === 'object') {
      callback(null, { path: 'config' }, JSON.stringify(config))
    }
  },

  /**
   * Parse Config
   */
  parseConfig: function(config, callback) {
    this.loadConfig(config, function(issues, file, contents) {
      if (issues) {
        callback(issues, null)
      } else {
        json.parse(file, contents).then(({ issues, parsed: jsObj }) => {
          if (issues && issues.length > 0) {
            callback(issues, null)
          } else {
            const parsedConfig = {
              ignore: jsObj.ignore ? jsObj.ignore : [],
              warn: jsObj.warn ? jsObj.warn : [],
              error: jsObj.error ? jsObj.error : [],
              ignoredFiles: jsObj.ignoredFiles ? jsObj.ignoredFiles : [],
            }
            callback(null, parsedConfig)
          }
        })
      }
    })
  },
}
