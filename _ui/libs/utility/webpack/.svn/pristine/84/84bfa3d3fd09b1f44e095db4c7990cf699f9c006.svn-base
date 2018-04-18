const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const prod = process.argv.indexOf('-p') !== -1;

const extractSass = new ExtractTextPlugin({
    filename: '[name]',
    allChunks: true
});

module.exports = {
    entry: {
        'js/main.bundle.js': path.resolve('_ui/skin/src/js/main.js'),
        'css/style.css': path.resolve('_ui/skin/src/sass/style.scss')
    },
    watch: !prod,
    plugins: [
        // Extract node_modules JS into vendor file
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: 'js/vendor.bundle.js',
            minChunks: function(module, count) {
                return (
                    module.resource &&
                    /\.js$/.test(module.resource) &&
                    module.resource.indexOf(
                        path.resolve('node_modules')
                    ) === 0
                )
            }
        }),
        // Extract SASS
        extractSass,
        // Clean up bundles
        new webpack.optimize.ModuleConcatenationPlugin()
    ],
    output: {
        // Output all files, relying on their names for folder structures
        path: path.resolve('_ui/skin/dist'),
        filename: '[name]'
    },
    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': '_ui/skin/src/js'
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        extends: path.resolve(__dirname, '.babelrc')
                    }
                }
            },
            {
                test: /\.(png|jp?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10,
                    name: 'img/[name].[ext]'
                }
            },
            {
                test: /\.scss$/,
                use: extractSass.extract({
                    publicPath: '../', // fix relative directories for url() -- mostly for images
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: true
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: true,
                                config: {
                                    path: path.resolve(__dirname, 'postcss.config.js')
                                }
                            }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                                outputStyle: "compact"
                            }
                        }
                    ]
                })
            }
        ]
    },
    stats: {
        colors: true
    },
    devtool: 'source-map'
};
