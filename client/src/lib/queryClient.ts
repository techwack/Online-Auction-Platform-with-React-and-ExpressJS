import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Make sure URL is absolute
  const fullUrl = url.startsWith('http') ? url : url;
  
  // Additional debugging
  console.log(`Making ${method} request to ${fullUrl}`);
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      // Add any additional headers here if needed
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    console.error(`API request failed: ${res.status} ${res.statusText}`);
    console.error(`URL: ${fullUrl}`);
    try {
      const errorText = await res.text();
      console.error(`Error response: ${errorText}`);
    } catch (e) {
      console.error('Could not read error response body');
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Additional debugging
    console.log(`Making query request to ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
      // Add headers if needed
      headers: {}
    });

    if (!res.ok) {
      console.error(`Query request failed: ${res.status} ${res.statusText}`);
      console.error(`URL: ${url}`);
      try {
        const errorText = await res.text();
        console.error(`Error response: ${errorText}`);
      } catch (e) {
        console.error('Could not read error response body');
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('Unauthorized request, returning null as specified');
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Changed to returnNull to handle unauthorized states
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // Set to 1 minute instead of Infinity for better reactivity
      retry: 1, // Allow one retry for transient network issues
    },
    mutations: {
      retry: 1, // Allow one retry
    },
  },
});
