"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import CheckoutForm from "./CheckoutForm";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = await loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const CURRENCY = "inr";

function Checkout({ order }) {
  const [remainingTime, setRemainingTime] = useState(0);

  // Calculate remaining time
  useEffect(() => {
    const calculateRemainingTime = () => {
      const expiresAt = new Date(order?.expiresAt).getTime();
      const now = new Date().getTime();
      const timeLeft = Math.max(0, expiresAt - now); // Ensure timeLeft is not negative
      setRemainingTime(timeLeft);
    };

    // Update remaining time every second
    // The interval ensures that the remainingTime is updated in real-time.
    const interval = setInterval(calculateRemainingTime, 1000);

    // The initial call to calculateRemainingTime ensures that the remainingTime state is set immediately, avoiding a delay of up to 1 second.
    calculateRemainingTime(); // Initial calculation

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [order.expiresAt]);

  // Format remaining time
  const formatTime = (time) => {
    if (time < 60000) {
      // Less than 60 seconds
      return `${Math.floor(time / 1000)} seconds`;
    } else {
      // More than 60 seconds
      const minutes = Math.floor(time / 60000);
      const seconds = Math.floor((time % 60000) / 1000);
      return `${minutes} minutes ${seconds} seconds`;
    }
  };

  return (
    <>
      {/* Instructions */}
      <Box sx={{ mb: 2, mx: 2 }}>
        <Typography variant='h6' sx={{ mb: 1 }}>
          To test payments:
        </Typography>
        <Box component='ol' sx={{ pl: 2.5, '& li': { mb: 1 } }}>
          <li>
            <Typography variant='body2'>Open terminal and run this command:</Typography>
            <Box sx={{ p: 1.5, bgcolor: '#e9ecef', borderRadius: 1, mt: 1, overflow: 'auto' }}>
              <Typography variant='body2' component='code' sx={{ fontFamily: 'monospace' }}>
                stripe listen --forward-to http://localhost:3000/api/sponsorship-payment/webhooks/stripe --skip-verify
              </Typography>
            </Box>
          </li>
          <li>
            <Typography variant='body2'>Use this test card number:</Typography>
            <Box sx={{ p: 1.5, bgcolor: '#e9ecef', borderRadius: 1, mt: 1 }}>
              <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                4000 0035 6000 0008
              </Typography>
            </Box>
          </li>
          <li>
            <Typography variant='body2'>
              Use any future date for expiry, any 3 digits for CVC
            </Typography>
          </li>
        </Box>
      </Box>

      {/* Payment Card */}
      <Card sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Checkout
          </Typography>

          <Typography variant="body1" gutterBottom>
            Order ID: {order.id}
          </Typography>

          <Typography variant="body1" gutterBottom>
            Ticket ID: {order.ticketId.id}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Ticket Title: {order.ticketId.title}
          </Typography>

          <Typography variant="body1" gutterBottom>
            Status: {order.status}
          </Typography>

          <Typography variant="body1" gutterBottom>
            Time Remaining: {formatTime(remainingTime)}
          </Typography>

          {remainingTime > 0 ? (
            <>
              <Elements
                stripe={stripePromise}
                options={{
                  mode: "payment",
                  amount: order.ticketId.price * 100, // amount in paise
                  currency: CURRENCY,
                }}
              >
                <CheckoutForm
                  amount={order.ticketId.price}
                  currency={CURRENCY}
                  orderId={order.id}
                />
              </Elements>
              <Typography>Use this number for Testing:</Typography>
              <Typography>
                <b>4000 0035 6000 0008</b>
              </Typography>
            </>
          ) : (
            <Typography variant="body1" color="error" sx={{ mt: 2 }}>
              Order Expired
            </Typography>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default Checkout;
