const path = require('path');

// Override Create React App webpack configs without ejecting
// https://github.com/timarney/react-app-rewired

module.exports = function override(config, env) {
  // Fix webpack-dev-server configuration for compatibility
  const isEnvDevelopment = env === 'development';
  
  if (isEnvDevelopment) {
    // Create a completely new devServer config to avoid deprecated options
    config.devServer = {
      ...config.devServer,
      // Remove all deprecated properties
      onAfterSetupMiddleware: undefined,
      onBeforeSetupMiddleware: undefined,
      // Add modern equivalent
      setupMiddlewares: (middlewares, devServer) => {
        return middlewares;
      },
      historyApiFallback: {
        disableDotRule: true,
        index: '/index.html',
      },
      hot: true,
      compress: true,
      allowedHosts: 'all',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
      },
    };
    
    // Clean up any other deprecated webpack-dev-server options
    const deprecatedOptions = [
      'onAfterSetupMiddleware',
      'onBeforeSetupMiddleware', 
      'before',
      'after'
    ];
    
    deprecatedOptions.forEach(option => {
      if (config.devServer && config.devServer[option]) {
        delete config.devServer[option];
      }
    });
  }
  
  return config;
};