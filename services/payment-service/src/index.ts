import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createHmac } from 'crypto';

dotenv.config();

const app = express();
app.use(cors());

// ── Paystack webhook needs raw body for HMAC verification ──
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string | undefined;
  const secret = process.env.PAYSTACK_SECRET_KEY || '';

  if (secret && signature) {
    const hash = createHmac('sha512', secret)
      .update(req.body)
      .digest('hex');

    if (hash !== signature) {
      res.status(400).json({ error: 'Invalid Paystack webhook signature' });
      return;
    }
  }

  // Parse and forward to Next.js webhook handler (or handle inline here)
  const event = JSON.parse(req.body.toString());
  console.log('[Paystack Webhook]', event?.event, event?.data?.reference);

  // The main webhook processing lives in the Next.js route:
  // app/api/v1/payments/webhook/route.ts
  // This microservice acts as a proxy / secondary listener if needed.

  res.json({ received: true });
});

app.use(express.json());

app.get('/api/payments/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'oversite-payment-service', gateway: 'paystack' });
});

// ── Paystack transaction initialization proxy (optional) ──
// The primary initialization happens directly in Next.js:
// app/api/v1/payments/initialize/route.ts
app.post('/api/payments/checkout', async (req: Request, res: Response) => {
  const { taskId, amount, reference } = req.body;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    res.status(503).json({ error: 'PAYSTACK_SECRET_KEY not configured' });
    return;
  }

  try {
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // NGN → kobo
        reference,
        currency: 'NGN',
        metadata: { taskId },
      }),
    });

    const data = await paystackRes.json();

    if (!paystackRes.ok || !data.status) {
      res.status(502).json({ error: data.message || 'Paystack error' });
      return;
    }

    res.json({
      authorizationUrl: data.data?.authorization_url,
      accessCode: data.data?.access_code,
      reference: data.data?.reference,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Payment microservice (Paystack) listening on port ${PORT}`);
});
