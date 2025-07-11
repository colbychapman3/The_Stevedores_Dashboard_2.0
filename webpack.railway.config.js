const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './static/js/master-dashboard.js',
    widgets: './static/js/widgets.js',
    'widget-manager': './static/js/widget-manager.js',
    'offline-storage': './static/js/offline-storage.js',
    wizard: './static/js/wizard.js',
    'ship-info': './static/js/ship-info.js'
  },
  
  output: {
    path: path.resolve(__dirname, 'static/dist'),
    filename: '[name].js',
    clean: true,
    publicPath: '/static/dist/'
  },
  
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      }),
    ],
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'static/js'),
    },
  },
  
  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
  },
};