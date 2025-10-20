//@ts-check

'use strict';

const path = require('path');
const { rspack, CssExtractRspackPlugin } = require('@rspack/core');

//@ts-check
/** @typedef {import('@rspack/core').Configuration} RspackConfig **/

/** @type RspackConfig */
const extensionConfig = {
  target: 'web', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './app/src/index.tsx', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'media'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
    alias: {
      '@xyflow/react/dist/style.css': path.resolve(
        __dirname,
        'node_modules/@xyflow/react/dist/style.css'
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      // {
      //   test: /\.css$/,
      //   use: [
      //     CssExtractRspackPlugin.loader,
      //     'css-loader'
      //   ],
      //   include: [
      //     path.resolve(__dirname, 'app/src'), // your source
      //     path.resolve(__dirname, 'node_modules/@xyflow/react') // external CSS
      //   ]
      // },
      // {
      //   test: /\.css(\?.*)?$/,
      //   use: [
      //     CssExtractRspackPlugin.loader, // extracts CSS to a separate file
      //     'css-loader',                  // resolves @import and url()
      //   ],
      // }
    ]
  },
  plugins: [
    new CssExtractRspackPlugin({
      filename: 'style.css',
    }),
    new rspack.HtmlRspackPlugin({
      template: './app/public/index.html',
      filename: 'index.html',
      inject: 'body'
    }),
  ],
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
module.exports = [ extensionConfig ];