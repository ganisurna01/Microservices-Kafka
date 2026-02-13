"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Box,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";
import CreateIcon from "@mui/icons-material/Create";

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircleIcon sx={{ color: "success.main" }} />;
    case "pending_payment":
      return <PendingIcon sx={{ color: "warning.main" }} />;
    case "created":
      return <CreateIcon sx={{ color: "info.main" }} />;
    case "cancelled":
      return <CancelIcon sx={{ color: "error.main" }} />;
    default:
      return null;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "success";
    case "pending_payment":
      return "warning";
    case "created":
      return "info";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

export default function OrdersList({orders}) {
    console.log({orders});
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Order List
      </Typography>
      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent>
                {/* Order ID */}
                <Typography variant="h6" component="h2" gutterBottom>
                  Order ID: {order.id}
                </Typography>

                {/* Status */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  {getStatusIcon(order.status)}
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    sx={{ ml: 1, textTransform: "capitalize" }}
                  />
                </Box>

                {/* Ticket Details */}
                <Typography variant="body1" gutterBottom>
                  <strong>Ticket:</strong> {order.ticketId.title}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Price:</strong> ${order.ticketId.price}
                </Typography>

                {/* User ID */}
                <Typography variant="body1" gutterBottom>
                  <strong>User ID:</strong> {order.userId}
                </Typography>

                {/* Actions */}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={order.status !== "pending_payment"}
                  >
                    {order.status === "pending_payment" ? "Pay Now" : "View Details"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}