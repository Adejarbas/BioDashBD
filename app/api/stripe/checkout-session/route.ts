export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  successResponse,
  unauthorizedResponse,
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
      return unauthorizedResponse('Faça o Login para continuar');
    }

    if (!user.email) {
      return errorResponse('User email is required', 400);
    }

    // (Opcional) Receber dados do produto via body
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
      success_url: `${(env.FRONTEND_URL || 'http://localhost:3001')}/dashboard`,
      cancel_url: `${env.FRONTEND_URL || 'http://localhost:3001'}`,
      customer_email: user.email,
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


