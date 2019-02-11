// next.config.js
const withScss = require('@zeit/next-sass')
const withCss = require('@zeit/next-css')
module.exports = withCss(
  withScss({
    assetPrefix: './',
  }),
)
