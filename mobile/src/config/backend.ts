import Constants from 'expo-constants';

function getAutoHttpUrl(): string {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    // WS-style URL can be converted if provided as ws://
    return process.env.EXPO_PUBLIC_BACKEND_URL.replace(/^ws(s?):\/\//, 'http$1://').replace(/\/ws$/, '');
  }
  const host = Constants.manifest?.debuggerHost?.split(':')[0];
  if (host) return `http://${host}:3000`;
  // Android emulator
  return 'http://10.0.2.2:3000';
}

export const BACKEND_HTTP_URL = getAutoHttpUrl();
