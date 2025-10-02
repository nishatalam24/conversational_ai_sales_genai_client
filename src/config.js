const config = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5001/chat',
    wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:5001',
    environment: 'development',
    debug: true
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://your-production-api.com/chat',
    wsUrl: process.env.REACT_APP_WS_URL || 'wss://your-production-api.com',
    environment: 'production',
    debug: false
  },
  test: {
    apiUrl: 'http://localhost:5001/chat',
    wsUrl: 'ws://localhost:5001',
    environment: 'test',
    debug: true
  }
};

export const getConfig = () => {
  const environment = process.env.NODE_ENV || 'development';
  return config[environment];
};

export const getApiUrl = () => getConfig().apiUrl;
export const getWsUrl = () => getConfig().wsUrl;
export const isDebug = () => getConfig().debug;