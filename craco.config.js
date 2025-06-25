module.exports = {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      return middlewares;
    },
    historyApiFallback: true,
    hot: true,
    compress: true,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Remove deprecated options if they exist
      if (webpackConfig.devServer) {
        delete webpackConfig.devServer.onAfterSetupMiddleware;
        delete webpackConfig.devServer.onBeforeSetupMiddleware;
      }
      return webpackConfig;
    },
  },
};
