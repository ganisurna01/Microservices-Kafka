import React from "react";
import { getCookieHeader } from "../../../hooks/useServerFetch";
import OrdersList from "@/components/OrdersList";

async function page({}) {
  const cookieHeader = await getCookieHeader();

  // fetch order details from your database or API
  const response = await fetch(
    `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/orders`,
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

  return <OrdersList orders={data.orders} />;
}

export default page;
