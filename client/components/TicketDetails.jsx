"use client";

import React from "react";
import { Card, CardContent, Typography, Divider, Box, Chip } from "@mui/material";

const TicketDetails = ({ ticket }) => {
  if (!ticket) {
    return (
      <Typography variant="body1" color="text.secondary">
        No ticket data available.
      </Typography>
    );
  }

  return (
    <Card elevation={3} sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {ticket.title}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body1">
            <strong>ID:</strong> {ticket.id}
          </Typography>
          <Typography variant="body1">
            <strong>Price:</strong> ${ticket.price}
          </Typography>
          <Typography variant="body1">
            <strong>Created by:</strong> {ticket.userId}
          </Typography>
          <Chip
            size="small"
            label={
              <Typography variant="body1">Version: {ticket.version}</Typography>
            }
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TicketDetails;
