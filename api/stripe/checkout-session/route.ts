export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const env = (typeof globalThis !== "undefined" && (globalThis as any).process && (globalThis as any).process.env)
  ? (globalThis as any).process.env
  : ({} as Record<string, string | undefined>);

// Use as chaves do ambiente (não exponha chaves secretas no repositório).
const stripe = new Stripe(env.STRIPE_SECRET_KEY || env.SECRET_STRIPE_KEY || '', {
  apiVersion: '2025-08-27.basil' as any,
});

export async function POST(req: NextRequest) {
  // Autenticação via Supabase usando cookies (App Router)
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // (Opcional) Receber dados do produto via body
  // const { productName, amount } = await req.json();

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'BRL',
            product_data: {
              name: 'Valor pagamento', // Troque conforme necessário
            },
            unit_amount: 2000, // Troque conforme necessário
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
  success_url: 'http://localhost:3001/dashboard',
  cancel_url: 'http://localhost:3001',
      customer_email: user.email,
    });
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
