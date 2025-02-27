const webpack = require('webpack')

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.XR_ENV': JSON.stringify(process.env.XR_ENV || ''),
    }),
  ],
}
