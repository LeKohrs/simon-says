const merge = require('webpack-merge');

// Load base config
const config_base = require('./_ui/libs/utility/webpack/config/webpack.config.js');

// Custom config
const config_custom = {};

// Merge base and custom config
module.exports = merge.strategy({ entry: 'replace' })(config_base, config_custom);
