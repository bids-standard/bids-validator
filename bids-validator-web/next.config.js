// next.config.js
const withScss = require('@zeit/next-sass')
const withCss = require('@zeit/next-css')
module.exports = withCss(
  withScss({
    assetPrefix: './',
    webpack: (config, {}) => {
      config.resolve.symlinks = false
      return config
    }
  }),
)
