"use client";
import { useState, useEffect } from "react";

const BASE_URL = "https://ticketing.dev";

export default function useClientFetch({ url, method = "GET", body = null }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [shouldRefetch, setShouldRefetch] = useState(false);

  function refetch() {
    setShouldRefetch((prev) => !prev);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(BASE_URL + url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          ...(body ? { body: JSON.stringify(body) } : {}), // Conditionally add body
          credentials: "include",
          cache: "no-cache",
        });

        if (!response.ok) {
          const resData = await response.json();
          console.log(resData);
          let err = new Error(
            resData?.errors[0]?.message ||
              `HTTP error! status: ${response.status}`
          );
          setError(err);
        } else {
          const resData = await response.json();
          setData(resData);
        }
      } catch (error) {
        console.error("Error:", error);
        setError(error);
      }
    }

    fetchData();
  }, [shouldRefetch]);
  return { data, error, refetch };
}
