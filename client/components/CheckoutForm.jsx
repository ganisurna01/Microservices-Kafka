"use client";
import React, { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

function CheckoutForm({ amount, orderId, currency }) {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setErrorMessage("Error: Stripe or Elements not loaded");
      setLoading(false);
      return;
    }

    try {
      // Fetch clientSecret
      const response = await fetch("https://ticketing.dev/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount * 100,
          currency: currency,
          orderId,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch client secret");
      }

      const data = await response.json(); // { clientSecret, orderId, paymentId }

      // Submit payment details
      const { error: submitError } = await elements.submit();

      if (submitError) {
        setErrorMessage(submitError.message);
        setLoading(false);
        return;
      }

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements: elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `https://ticketing.dev/payment-success?amount=${amount}&orderId=${
            data.orderId || orderId
          }&paymentId=${data.paymentId}`,
        },
        metadata: {
          orderId: data.orderId || orderId,
          paymentId: data.paymentId,
        }, // Include orderId in metadata
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Payment success");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-2 rounded-md text-black"
    >
      <PaymentElement />
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <button
        className="text-white bg-black mt-3 w-full p-5 font-bold rounded-md disabled:opacity-50 disabled:animate-pulse"
        disabled={loading || !stripe}
        type="submit"
      >
        {loading ? "Processing..." : `Pay ₹${amount}`}
      </button>
    </form>
  );
}

export default CheckoutForm;

// "use client";

// import {
//   PaymentElement,
//   useElements,
//   useStripe,
// } from "@stripe/react-stripe-js";
// import { useRouter } from "next/navigation";
// import React, { useEffect, useState } from "react";

// function CheckoutForm({
//   amount,
//   currency,
//   orderId,
// }) {
//   const stripe = useStripe();
//   const elements = useElements();

//   const [errorMessage, setErrorMessage] = useState();
//   const [clientSecret, setClientSecret] = useState("");
//   const [paymentId, setPaymentId] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetch("https://ticketing.dev/api/payments", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         amount: amount * 100,
//         currency,
//         orderId: orderId,
//       }),
//       credentials: "include",
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         setClientSecret(data.clientSecret);
//         setPaymentId(data.paymentId);
//       });
//   }, [amount]);

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setLoading(true);

//     if (!stripe || !elements) {
//       setErrorMessage("Error: Stripe or Elements not loaded");
//       setLoading(false);
//       return;
//     }

//     const { error: submitError } = await elements.submit();

//     if (submitError) {
//       setErrorMessage(submitError.message);
//       setLoading(false);
//       return;
//     }

//     const {error} = await stripe.confirmPayment({
//       elements: elements,
//       clientSecret: clientSecret,
//       confirmParams: {
//         return_url: `https://ticketing.dev/payment-success?amount=${amount}&orderId=${orderId}&paymentId=${paymentId}`,
//       },
//       metadata: { orderId: orderId, paymentId: paymentId }, // Include orderId in metadata
//     });

//     if (error) {
//       setErrorMessage(error.message);
//     } else {
//       setErrorMessage("Payment success");
//     }

//     setLoading(false);
//   };

//   if (!clientSecret || !stripe || !elements) {
//     return (
//       <div className="flex items-center justify-center">
//         <div
//           className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
//           role="status"
//         >
//           <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
//             Loading...
//           </span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="bg-white p-2 rounded-md text-black"
//     >
//       {clientSecret && <PaymentElement />}
//       {errorMessage && <div>{errorMessage}</div>}
//       <button
//         className="text-white bg-black mt-3 w-full p-5 font-bold rounded-md disabled:opacity-50 disabled:animate-pulse"
//         disabled={loading || !clientSecret || !stripe}
//         type="submit"
//       >
//         {loading ? "Processing..." : `Pay ₹${amount}`}
//       </button>
//     </form>
//   );
// }

// export default CheckoutForm;
