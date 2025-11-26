export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';

const env = (typeof globalThis !== "undefined" && (globalThis as any).process && (globalThis as any).process.env)
  ? (globalThis as any).process.env
  : ({} as Record<string, string | undefined>);

// Use as chaves do ambiente (não exponha chaves secretas no repositório).
const stripe = new Stripe(env.STRIPE_SECRET_KEY || env.SECRET_STRIPE_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!env.STRIPE_SECRET_KEY && !env.SECRET_STRIPE_KEY) {
      return errorResponse('Stripe not configured', 501);
    }

    // Receber dados do produto via body
    const body = await req.json().catch(() => ({}));
    const { productName, amount } = body;

    // Validação de amount se fornecido
    if (amount !== undefined) {
      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum < 0) {
        return validationErrorResponse({
          amount: ['Amount must be a positive number'],
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'BRL',
            product_data: {
              name: productName || 'Valor pagamento',
            },
            unit_amount: amount ? Math.round(amount * 100) : 2000, // Converter para centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${(env.FRONTEND_URL || 'https://bio-dash-front-theta.vercel.app/')}/dashboard`,
      cancel_url: `${env.FRONTEND_URL || 'https://bio-dash-front-theta.vercel.app/'}`,
    });

    if (!session.url) {
      return errorResponse('Failed to create checkout session', 500);
    }

    return successResponse({ url: session.url }, 'Checkout session created successfully');
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    if (error instanceof SyntaxError) {
      return errorResponse('Invalid request body', 400);
    }
    return errorResponse(error.message || 'Failed to process payment', 500);
  }
}


