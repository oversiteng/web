import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const app = express();
app.use(cors());

// Webhook endpoint needs raw body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  // TODO: Verify webhook signature and handle events
  console.log('Received Stripe Webhook');
  res.json({ received: true });
});

app.use(express.json());

app.get('/api/payments/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'oversite-payment-service' });
});

app.post('/api/payments/checkout', async (req: Request, res: Response) => {
  // TODO: Initialize Stripe checkout session
  res.json({ clientSecret: 'mock-secret', status: 'pending' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Payment microservice listening on port ${PORT}`);
});
