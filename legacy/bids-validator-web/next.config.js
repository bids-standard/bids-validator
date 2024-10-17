// next.config.js

module.exports = {
  output: 'export',
  transpilePackages: ['bids-validator'],
  assetPrefix: './',
  webpack: (config, {}) => {
    config.watchOptions.ignored = '**/node_modules'
    return config
  },
}
