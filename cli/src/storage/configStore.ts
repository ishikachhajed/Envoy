import fs from 'fs';
import path from 'path';
import { CONFIG_DIR, CONFIG_FILE_PATH } from '../utils/constants.js';
export interface EnvoyConfig {
  token?: string;
  organizationId?: string;
  projectId?: string;
  environment?: string;
  backendUrl?: string;
}
export const loadConfig = (): EnvoyConfig => {
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    return {};
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};
export const saveConfig = (config: Partial<EnvoyConfig>): void => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const currentConfig = loadConfig();
  const newConfig = { ...currentConfig, ...config };
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
};
export const clearConfig = (): void => {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    fs.unlinkSync(CONFIG_FILE_PATH);
  }
};