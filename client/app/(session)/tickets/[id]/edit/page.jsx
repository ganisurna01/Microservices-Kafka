"use server";
import React from "react";
import TicketForm from "@/components/TicketForm";
import useServerFetch from "@/hooks/useServerFetch";

async function page({ params }) {
  const { id } = await params;

  console.log('id: ' + id);

  const { data, error } = await useServerFetch({
    url: `/api/tickets/${id}`,
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  
  return <TicketForm data={data.ticket} />;
}

export default page;
