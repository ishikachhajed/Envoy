import { getApiClient } from '../api/client.js';
import { Organization } from '../types/organization.js';
export const listOrganizations = async (): Promise<Organization[]> => {
  const client = getApiClient();
  const response = await client.get('/api/organizations/mine');
  return response.data;
};
export const createOrganization = async (name: string): Promise<Organization> => {
  const client = getApiClient();
  const response = await client.post('/api/organizations', { name });
  return response.data;
};
