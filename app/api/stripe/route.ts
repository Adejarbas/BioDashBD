import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/api-response';

const env = (typeof globalThis !== "undefined" && (globalThis as any).process && (globalThis as any).process.env)
  ? (globalThis as any).process.env
  : ({} as Record<string, string | undefined>);

const stripe = new Stripe(env.STRIPE_SECRET_KEY || env.SECRET_STRIPE_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!env.STRIPE_SECRET_KEY && !env.SECRET_STRIPE_KEY) {
      return errorResponse('Stripe not configured', 501);
    }

    // Autenticação via Supabase usando cookies (App Router)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, { ...options, path: "/" });
              });
            } catch (error) {
              // Cookies são automaticamente persistidos no App Router
            }
          },
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    if (!user.email) {
      return errorResponse('User email is required', 400);
    }

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
      success_url: `${env.FRONTEND_URL || 'http://localhost:3000'}`,
      cancel_url: `${env.FRONTEND_URL || 'http://localhost:3000'}`,
      customer_email: user.email,
    });

    if (!session.url) {
      return errorResponse('Failed to create checkout session', 500);
    }

    return successResponse({ url: session.url }, 'Checkout session created successfully');
  } catch (error: any) {
    console.error('Stripe error:', error);
    return errorResponse(error.message || 'Failed to process payment', 500);
  }
}


