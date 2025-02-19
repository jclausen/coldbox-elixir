const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CleanObsoleteChunks = require("webpack-clean-obsolete-chunks");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const styleLoaders = require("./utils/styleLoaders");
const { merge } = require("webpack-merge");
const path = require("path");
const fs = require("fs");

const dotEnvFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(dotEnvFile)) {
    require("dotenv").config({
        path: dotEnvFile
    });
}

module.exports = () => ({
    mode: global.elixir.isProduction ? "production" : "development",
    output: {
        path: global.elixir.rootPath,
        publicPath: "/",
        filename: global.elixir.versioning
            ? "[name].[chunkhash].js"
            : "[name].js"
    },
    module: {
        parser: {
            javascript: {
              exportsPresence: global.elixir.isProduction ? false : 'auto',
              importExportsPresence : global.elixir.isProduction ? false : 'auto'
            }
        },
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: merge(global.elixir.config.babelOptions, {
                    sourceMap : true,
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                modules: false,
                                targets: {
                                    browsers: ["> 2%"]
                                }
                            }
                        ]
                    ]
                })
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                type: "asset",
                parser: {
                    dataUrlCondition: {
                        maxSize: 1000000 // 1000 kb
                    }
                }
            },
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                type: "asset",
                parser: {
                    dataUrlCondition: {
                        maxSize: 1000000 // 1000 kb
                    }
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                type: "asset",
                parser: {
                    dataUrlCondition: {
                        maxSize: 10000000 // 10000 kb
                    }
                }
            }
        ].concat(
            styleLoaders({
                sourceMap: true,
                extract: true
            })
        )
    },
    devtool: global.elixir.isProduction
                ? "source-map"
                : "eval-source-map",
    resolve: {
        fallback: {
            dgram: false,
            fs: false,
            net: false,
            tls: false,
            child_process: false,
            timers: require.resolve("timers-browserify"),
            path: require.resolve("path-browserify")
        },
        extensions: [".js", ".json"],
        alias: {
            "@": path.join(global.elixir.rootPath, "resources/assets/js")
        }
    },
    plugins: [
        new ProgressBarPlugin(),
        // add these based on what features are enabled
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [
                global.elixir.manifestFileName,
                global.elixir.runtimeFileNameWithoutExtension,
                global.elixir.vendorChunkFileNameWithoutExtension
            ]
        }),
        new CleanObsoleteChunks({
            verbose: false
        }),
        new WebpackManifestPlugin({
            fileName: global.elixir.manifestFileName
        }),
        new MiniCssExtractPlugin({
            filename: global.elixir.versioning
                ? "[name].[contenthash].css"
                : "[name].css"
        })
    ],
    stats: {
        children: false
    },
    optimization: {
        runtimeChunk: {
            name: global.elixir.runtimeFileNameWithoutExtension
        },
        splitChunks: {
            cacheGroups: {
                defaultVendors: {
                    test: (m, c, entry) => {
                        return (
                            m.constructor.name !== "CssModule" &&
                            /[\\/]node_modules[\\/]/.test(m.resource)
                        );
                    },
                    name: global.elixir.vendorChunkFileNameWithoutExtension,
                    enforce: true,
                    chunks: "all"
                }
            }
        },
        minimize : global.elixir.isProduction,
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin()
        ]
    }
});
