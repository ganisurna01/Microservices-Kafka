import React from 'react'
import PaymentSuccess from '../../../components/PaymentSucess'

async function page({searchParams}) {
    const {orderId, paymentId, amount} = await searchParams;
  return (
    <PaymentSuccess orderId={orderId} paymentId={paymentId} amount={amount} />
  )
}

export default page