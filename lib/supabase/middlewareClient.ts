import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export function createMiddlewareClient(req: NextRequest, res: any) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, { ...options, path: "/" });
          });
        },
      },
    }
  );
}
