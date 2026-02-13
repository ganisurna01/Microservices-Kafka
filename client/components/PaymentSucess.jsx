"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HomeIcon from "@mui/icons-material/Home";
import { useRouter } from "next/navigation";

function PaymentSuccess({ paymentId, orderId, amount }) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/landing"); // Redirect to the home page
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ textAlign: "center", p: 4, boxShadow: 3 }}>
        <CardContent>
          {/* Success Icon */}
          <Box sx={{ color: "success.main", fontSize: "4rem", mb: 2 }}>
            <CheckCircleIcon fontSize="inherit" />
          </Box>

          {/* Success Message */}
          <Typography variant="h4" component="h1" gutterBottom>
            Payment Successful!
          </Typography>

          {/* Payment Details */}
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Thank you for your purchase. Your payment has been successfully
            processed.
          </Typography>

          {/* Amount Paid */}
          <Box
            sx={{
              backgroundColor: "success.light",
              borderRadius: 2,
              p: 2,
              my: 3,
            }}
          >
            <Typography variant="h6" component="div" sx={{ fontWeight: "bold", color: 'white' }}>
              Amount Paid:
            </Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1, color: 'white' }}>
              ${amount}
            </Typography>
          </Box>

          {/* Payment ID */}
          <Typography variant="body1" sx={{ mt: 2 }}>
            <strong>Payment ID:</strong> {paymentId}
          </Typography>

          {/* Order ID */}
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Order ID:</strong> {orderId}
          </Typography>

          {/* Go Home Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{ mt: 4 }}
          >
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default PaymentSuccess;