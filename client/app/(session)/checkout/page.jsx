import React from "react";
import Checkout from "../../../components/Checkout";
import { getCookieHeader } from "../../../hooks/useServerFetch";

async function page({ searchParams }) {
  const { orderId } = await searchParams;

  const cookieHeader = await getCookieHeader()

  // fetch order details from your database or API
  const response = await fetch(
    `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/orders/${orderId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader, // Pass cookies to the backend
      },
      credentials: "include",
      cache: "no-cache",
    }
  );
  if (!response.ok) {
    console.error("Failed to fetch order");
  }
  const data = await response.json();

  return <Checkout order={data.order} />;
}

export default page;
