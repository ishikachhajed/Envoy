import { getApiClient } from '../api/client.js';
export const requestOtp = async (email: string): Promise<void> => {
  const client = getApiClient();
  await client.post('/api/auth/request-otp', { email });
};
export const verifyOtp = async (email: string, otp: string): Promise<string> => {
  const client = getApiClient();
  const response = await client.post('/api/auth/verify-otp', { email, otp });
  // Assuming the backend returns { token: "..." }
  return response.data.token;
};