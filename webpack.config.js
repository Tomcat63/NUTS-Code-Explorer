
const Path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: Path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  devServer: {
    static: [
      {
        directory: Path.join(__dirname, 'assets'),
        publicPath: '/assets',
      },
      {
        directory: Path.join(__dirname, '/'),
      },
      {
        directory: Path.join(__dirname, 'dist'),
      }
    ],
    port: 5173,
    hot: true,
    historyApiFallback: true,
  },
  watchOptions: {
    ignored: ['**/node_modules', '**/*.md', '**/dist', '**/assets'],
  },
};
