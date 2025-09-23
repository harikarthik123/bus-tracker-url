import { decode } from 'base-64';

// Polyfill for atob if not available (e.g., in React Native environment)
if (typeof atob === 'undefined') {
  global.atob = decode;
}

const decodeToken = (token) => {
  if (!token) {
    return null;
  }
  try {
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default decodeToken;
