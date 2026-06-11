import { getApiClient } from '../api/client.js';
import { Secret } from '../types/secret.js';
export const listSecrets = async (envId: string): Promise<Secret[]> => {
  const client = getApiClient();
  const response = await client.get(`/api/environments/${envId}/secrets`);
  return response.data;
};

export const listSecretsForServiceToken = async (): Promise<Secret[]> => {
  const client = getApiClient();
  const response = await client.get(`/api/service-token/secrets`);
  return response.data;
};
export const createSecret = async (envId: string, key: string, value: string): Promise<Secret> => {
  const client = getApiClient();
  const response = await client.post(`/api/environments/${envId}/secrets`, { key, value });
  return response.data;
};
export const revealSecret = async (secretId: string): Promise<Secret> => {
  const client = getApiClient();
  const response = await client.get(`/api/secrets/${secretId}/reveal`);
  return response.data;
};
export const deleteSecret = async (secretId: string): Promise<void> => {
  const client = getApiClient();
  await client.delete(`/api/secrets/${secretId}`);
};