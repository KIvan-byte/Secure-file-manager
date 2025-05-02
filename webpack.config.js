module.exports = {
  // Existing webpack config will be merged with this
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // Custom middleware setup can go here if needed
      return middlewares;
    }
  }
};