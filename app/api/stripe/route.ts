import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const env = (typeof globalThis !== "undefined" && (globalThis as any).process && (globalThis as any).process.env)
  ? (globalThis as any).process.env
  : ({} as Record<string, string | undefined>);

const stripe = new Stripe(env.STRIPE_SECRET_KEY || env.SECRET_STRIPE_KEY || '');

export async function POST(req: NextRequest) {
  if (!env.STRIPE_SECRET_KEY && !env.SECRET_STRIPE_KEY) {
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 501 })
  }
  // Autenticação via Supabase usando cookies (App Router)
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'BRL',
            product_data: { name: 'Valor pagamento' },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.FRONTEND_URL || 'http://localhost:3001'}`,
      cancel_url: `${env.FRONTEND_URL || 'http://localhost:3001'}`,
      customer_email: user.email,
    });
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


