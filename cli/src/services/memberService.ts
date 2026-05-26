import { getApiClient } from '../api/client.js';
import { Member } from '../types/member.js';
export const listMembers = async (orgId: string): Promise<Member[]> => {
  const client = getApiClient();
  const response = await client.get(`/api/organizations/${orgId}/members`);
  return response.data;
};
export const inviteMember = async (orgId: string, email: string, role: string): Promise<void> => {
  const client = getApiClient();
  await client.post(`/api/organizations/${orgId}/members`, { email, role });
};
export const updateMemberRole = async (orgId: string, userId: string, role: string): Promise<void> => {
  const client = getApiClient();
  await client.patch(`/api/organizations/${orgId}/members/${userId}/role`, { role });
};
export const removeMember = async (orgId: string, userId: string): Promise<void> => {
  const client = getApiClient();
  await client.delete(`/api/organizations/${orgId}/members/${userId}`);
};
