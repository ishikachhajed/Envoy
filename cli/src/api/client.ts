import axios from 'axios';
import { loadConfig } from '../storage/configStore.js';
import { DEFAULT_BACKEND_URL } from '../utils/constants.js';
export const getApiClient = () => {
  const config = loadConfig();
  const baseURL = config.backendUrl || DEFAULT_BACKEND_URL;
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Prioritize ENVOY_TOKEN from environment variables for servers (Render/Vercel)
  const token = process.env.ENVOY_TOKEN || config.token;

  if (token) {
    client.interceptors.request.use((req) => {
      req.headers.Authorization = `Bearer ${token}`;
      return req;
    });
  }
  return client;
};