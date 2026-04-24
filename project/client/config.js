const isFileProtocol = window.location.protocol === 'file:';
const defaultApiBase = isFileProtocol
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;

window.APP_CONFIG = {
  API_BASE_URL: defaultApiBase,
};
