const axios = require('axios');

// Razorpay API configuration
const RAZORPAY_API_KEY = process.env.RAZORPAY_API_KEY;
const RAZORPAY_API_SECRET = process.env.RAZORPAY_API_SECRET;

// Create an order
async function createOrder(amount, currency='INR') {
    const options = {
        method: 'POST',
        url: 'https://api.razorpay.com/v1/orders',
        auth: {
            username: RAZORPAY_API_KEY,
            password: RAZORPAY_API_SECRET
        },
        data: {
            amount: amount,
            currency: currency,
            receipt: 'receipt#1',
            payment_capture: 1
        }
    };

    try {
        const response = await axios(options);
        return response.data;
    } catch (error) {
        console.error('Error creating order:', error.response.data);
        throw error;
    }
}

// Verify payment signature
function verifyPaymentSignature(paymentDetails) {
    const crypto = require('crypto');
    const generatedSignature = crypto.createHmac('sha256', RAZORPAY_API_SECRET)
        .update(`${paymentDetails.order_id}|${paymentDetails.payment_id}`)
        .digest('hex');

    return generatedSignature === paymentDetails.signature;
}

// Fetch payment details
async function fetchPaymentDetails(paymentId) {
    const options = {
        method: 'GET',
        url: `https://api.razorpay.com/v1/payments/${paymentId}`,
        auth: {
            username: RAZORPAY_API_KEY,
            password: RAZORPAY_API_SECRET
        }
    };

    try {
        const response = await axios(options);
        return response.data;
    } catch (error) {
        console.error('Error fetching payment details:', error.response.data);
        throw error;
    }
}

module.exports = { createOrder, verifyPaymentSignature, fetchPaymentDetails };