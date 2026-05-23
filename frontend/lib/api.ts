const BASE_URL = "http://localhost:8080";
export interface ApiError {
  message: string;
  status: number;
}
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  
  // 1. Setup default headers
  const headers = new Headers(options.headers || {});
  
  // Inject Content-Type if body is defined and not already specified
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  // 2. Retrieve JWT token from localStorage and inject Authorization header
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("envoy_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };
  try {
    const response = await fetch(url, fetchOptions);
    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }
    if (!response.ok) {
      let errorMessage = "An error occurred during the request.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
      };
      throw error;
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json() as T;
    }
    return (await response.text()) as unknown as T;
  } catch (error: any) {
    if (error.status) {
      throw error; // Rethrow parsed API error
    }
    // Network / unexpected error
    const networkError: ApiError = {
      message: error.message || "Network request failed. Ensure backend is running.",
      status: 500,
    };
    throw networkError;
  }
}