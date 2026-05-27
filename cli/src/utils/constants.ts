import os from 'os';
import path from 'path';

export const CONFIG_DIR = path.join(os.homedir(), '.envoy');
export const CONFIG_FILE_PATH = path.join(CONFIG_DIR, 'config.json');

export const DEFAULT_BACKEND_URL = process.env.ENVOY_API_URL || 'https://envoy-vault-backend.onrender.com';
