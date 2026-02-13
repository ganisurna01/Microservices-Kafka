"use server";
import { cookies } from "next/headers";

// Helper function to get the cookie header
export async function getCookieHeader() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  return cookieHeader;
}

// Base URL for the API
const BASE_URL =
  "http://ingress-nginx-controller.ingress-nginx.svc.cluster.local";

// Reusable fetch function for server components
export default async function useServerFetch({
  url,
  method = "GET",
  body = null,
  headers = {},
}) {
  let data = null;
  let error = null;

  try {
    // Get the cookie header
    const cookieHeader = await getCookieHeader();

    // Make the fetch request
    const response = await fetch(`${BASE_URL}${url}`, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader, // Pass cookies to the backend
        ...headers, // Merge additional headers if provided
      },
      ...(body ? { body: JSON.stringify(body) } : {}), // Conditionally add body
      credentials: "include", // Include credentials (cookies)
      cache: "no-cache", // Prevent caching
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => null); // Try to parse error response
      error = new Error(
        errorData?.message || `HTTP error! status: ${response.status}`
      );
      error.status = response.status; // Attach status code to the error
    } else {
      // Parse the response data
      data = await response.json();
    }
  } catch (err) {
    console.error("Error in useServerFetch:", err);
    error = err;
  }

  return { data, error };
}