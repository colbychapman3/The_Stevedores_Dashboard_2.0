const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      main: './static/js/master-dashboard.js',
      widgets: './static/js/widgets.js',
      'widget-manager': './static/js/widget-manager.js',
      'offline-storage': './static/js/offline-storage.js',
      wizard: './static/js/wizard.js',
      'ship-info': './static/js/ship-info.js',
      'pwa-install': './static/js/pwa-install.js',
      'push-notifications': './static/js/push-notifications.js',
      'performance-optimization': './static/js/performance-optimization.js',
      'lazy-loader': './static/js/lazy-loader.js',
      'performance-monitor': './static/js/performance-monitor.js',
      'advanced-caching': './static/js/advanced-caching.js',
      'advanced-pwa': './static/js/advanced-pwa.js',
      'advanced-analytics': './static/js/advanced-analytics.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'static/dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      clean: true,
      publicPath: '/static/dist/'
    },
    
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
          },
        }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
          charts: {
            test: /chart/i,
            name: 'charts',
            chunks: 'all',
            priority: 15,
          },
        },
      },
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
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },
    
    plugins: [
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
          chunkFilename: '[id].[contenthash].css',
        }),
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8,
        }),
        new GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60, // 1 hour
                },
              },
            },
          ],
        }),
      ] : []),
      ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : []),
    ],
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'static'),
      },
      compress: true,
      port: 9000,
      hot: true,
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'static/js'),
      },
    },
    
    stats: {
      assets: true,
      modules: false,
      chunks: true,
      chunkModules: false,
      colors: true,
      entrypoints: true,
    },
  };
};