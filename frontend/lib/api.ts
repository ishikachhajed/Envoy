const BASE_URL = "http://localhost:8080";
  export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
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
      const textResponse = await response.text();
      try {
        if (textResponse) {
          const errorData = JSON.parse(textResponse);
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch {
         errorMessage = textResponse || errorMessage;
      }
      throw new ApiError(errorMessage, response.status);
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
    throw new ApiError(error.message || "Network request failed. Ensure backend is running.", 500);
  }
}