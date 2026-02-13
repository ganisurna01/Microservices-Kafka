import React from "react";
import TicketDetails from "@/components/TicketDetails";
import useServerFetch from "@/hooks/useServerFetch";

async function page({ params }) {
  const { id } = await params;

  console.log("id: " + id);

  const { data, error } = await useServerFetch({
    url: `/api/tickets/${id}`,
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return <TicketDetails ticket={data.ticket} />;
}

export default page;
