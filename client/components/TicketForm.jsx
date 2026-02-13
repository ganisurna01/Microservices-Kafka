"use client";

import React, { useState } from "react";
import { Box, TextField, Button, Typography, Grid, Paper } from "@mui/material";
import useServerFetch from "../hooks/useServerFetch";
import { redirect } from "next/navigation";

const TicketForm = ({ data = {} }) => {
  const [formData, setFormData] = useState({
    title: data.title || "",
    price: data.price || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateTicket = async (ticketData) => {
    console.log("Ticket created:", ticketData);
    await useServerFetch({
      url: `/api/tickets/${data.id}`,
      method: "PUT",
      body: ticketData,
    });
    redirect("/landing");
  };

  const handleCreateTicket = async (ticketData) => {
    console.log("Ticket created:", ticketData);
    await useServerFetch({
      url: "/api/tickets",
      method: "POST",
      body: ticketData,
    });
    redirect("/landing");
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (data.id) {
      await handleUpdateTicket({...formData, price: +formData.price});
    } else {
      await handleCreateTicket({...formData, price: +formData.price});
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: "auto", mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {data.id ? "Edit Ticket" : "Add Ticket"}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="submit" variant="contained" color="primary">
                {data.id ? "Update" : "Create"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default TicketForm;
