const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/renderer.js',
  output: {
    path: path.resolve(__dirname, 'src/dist'),
    filename: 'renderer.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer/"),
      "os": require.resolve("os-browserify/browser")
    }
  },
  target: 'electron-renderer'
}; 