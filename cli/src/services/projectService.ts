import { getApiClient } from '../api/client.js';
import { Project } from '../types/project.js';
export const listProjects = async (orgId: string): Promise<Project[]> => {
  const client = getApiClient();
  const response = await client.get(`/api/organizations/${orgId}/projects`);
  return response.data;
};
export const createProject = async (orgId: string, name: string, description?: string): Promise<Project> => {
  const client = getApiClient();
  const response = await client.post(`/api/organizations/${orgId}/projects`, { name, description });
  return response.data;
};