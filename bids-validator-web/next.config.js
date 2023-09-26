// next.config.js

module.exports = {
  transpilePackages: ['bids-validator'],
  assetPrefix: './',
  webpack: (config, {}) => {
    config.watchOptions.ignored = '**/node_modules'
    return config
  },
}
