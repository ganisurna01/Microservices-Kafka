"use client";

import React from "react";
import useClientFetch from "../hooks/useClientFetch";
import useServerFetch from "../hooks/useServerFetch";
import Link from "next/link";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Alert,
  Box,
  Chip,
} from "@mui/material";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { useRouter } from "next/navigation";

function TicketsList() {
  let tickets = [];
  const { data, error, refetch } = useClientFetch({ url: "/api/tickets" });
  const { currentUser } = useCurrentUser();
  const router = useRouter();

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Error: {error.message}</Alert>
      </Container>
    );
  }

  if (data) {
    tickets = data.tickets;
  }

  const yourTickets = tickets.filter(
    (ticket) => ticket.userId === currentUser?.id
  );
  const otherTickets = tickets.filter(
    (ticket) => ticket.userId !== currentUser.id
  );

  async function handleOrderTicket(ticket) {
    try {
      const response = await fetch(`https://ticketing.dev/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, version: ticket.version }),
        credentials: "include",
      });
      if (response.ok) {
        const resData = await response.json();
        console.log(resData);
        // Redirect to checkout page
        router.push(`/checkout?orderId=${resData.order.id}`);
        refetch();
        alert(
          "Ticket reserved, Pay and buy to make it yours within 2 minutes!"
        );
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  const renderTickets = (tickets) => (
    <>
      {tickets.length > 0 &&
        tickets.map((ticket) => (
          <Grid item xs={12} sm={6} md={4} key={ticket.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  {ticket.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created by: {ticket.userId}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Price: ${ticket.price}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  OrderId: {ticket?.orderId || "none"}
                </Typography>
                <Chip
                  size="small"
                  label={
                    <Typography variant="body1">
                      Version: {ticket.version}
                    </Typography>
                  }
                />
                <Box className="flex items-center gap-2">
                  <Button
                    variant="outlined"
                    className="my-2"
                    color="primary"
                    fullWidth
                    component={Link}
                    href={`/tickets/${ticket.id}`}
                  >
                    View Details
                  </Button>
                  {!ticket.orderId && ticket.userId === currentUser.id && (
                    <Button
                      variant="outlined"
                      className="my-2"
                      color="primary"
                      fullWidth
                      component={Link}
                      href={`/tickets/${ticket.id}/edit`}
                    >
                      Edit Ticket
                    </Button>
                  )}
                </Box>
                <Button
                  variant="contained"
                  className="my-2"
                  color="primary"
                  fullWidth
                  disabled={ticket?.orderId}
                  onClick={() => handleOrderTicket(ticket)}
                >
                  {ticket?.orderId ? "Ticket Reserved" : "Order Ticket"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      {tickets.length === 0 && (
        <Grid item xs={12}>
          <Typography mt={2} variant="h5">
            No tickets available
          </Typography>
        </Grid>
      )}
    </>
  );

  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} className="text-right">
          <Button variant="contained" component={Link} href="/tickets/create">
            Add your own ticket
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h4">Your Tickets</Typography>
        </Grid>
        {renderTickets(yourTickets)}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h4">Other Tickets</Typography>
        </Grid>
        {renderTickets(otherTickets)}
      </Grid>

      <Divider sx={{ my: 4 }} />
    </Container>
  );
}

export default TicketsList;
