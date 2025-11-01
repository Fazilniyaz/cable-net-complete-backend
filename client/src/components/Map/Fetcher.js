// utils/fetcher.ts
// export interface FetcherConfig {
//   method?: "GET" | "POST" | "PUT" | "DELETE";
//   headers?: HeadersInit;
//   body?: any;
// }

export const fetcher = async ([url, config]) => {
  const res = await fetch(url, {
    method: config?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(config?.headers || {}),
    },
    body: config?.body ? JSON.stringify(config.body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }

  return res.json();
};
