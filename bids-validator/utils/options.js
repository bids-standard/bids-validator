var json = require('./json')

let options

module.exports = {
  /**
   * Parse
   */
  parse: function(args, callback) {
    options = args ? args : {}
    options = {
      ignoreWarnings: Boolean(options.ignoreWarnings),
      ignoreNiftiHeaders: Boolean(options.ignoreNiftiHeaders),
      ignoreSymlinks: Boolean(options.ignoreSymlinks),
      verbose: Boolean(options.verbose),
      gitTreeMode: Boolean(options.gitTreeMode),
      remoteFiles: Boolean(options.remoteFiles),
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

  getOptions: () => {
    const readonlyOptions = Object.freeze({ ...options })
    return readonlyOptions
  },

  /**
   * Load Config
   */
  loadConfig: function(config, callback) {
    var files = require('./files')
    if (typeof config === 'string') {
      var configFile = { path: config }
      configFile.stats = files.getFileStats(configFile)
      files
        .readFile(configFile)
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
