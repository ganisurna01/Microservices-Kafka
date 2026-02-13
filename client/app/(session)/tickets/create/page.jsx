"use server";

import React from "react";
import TicketForm from "@/components/TicketForm";
import { redirect } from "next/navigation";
import useServerFetch from "@/hooks/useServerFetch";

function page() {
  return <TicketForm />;
}

export default page;
