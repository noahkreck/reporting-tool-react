const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          process: require.resolve("process/browser"),
          zlib: require.resolve("browserify-zlib"),
          stream: require.resolve("stream-browserify"),
          util: require.resolve("util"),
          buffer: require.resolve("buffer"),
          asset: require.resolve("assert"),
          querystring: require.resolve("querystring-es3"),
          path: require.resolve("path-browserify"),
          crypto: require.resolve("crypto-browserify"),
          http: require.resolve("stream-http"),
          fs: false,
          net: false,
          async_hooks: false // Add this line to provide an empty module as a fallback for 'fs'
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      ],
    },
  },
};