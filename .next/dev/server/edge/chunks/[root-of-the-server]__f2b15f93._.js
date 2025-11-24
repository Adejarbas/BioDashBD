(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__f2b15f93._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware-edge] (ecmascript)");
;
;
// Remove barra final se existir na origem
function normalizeOrigin(origin) {
    return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}
const FRONTEND_ORIGIN = normalizeOrigin(process.env.FRONTEND_URL || "http://localhost:3001");
async function middleware(req) {
    // Preflight CORS para /api
    // CORS Preflight para /api
    if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api")) {
        const origin = req.headers.get("origin") || FRONTEND_ORIGIN;
        const normalizedOrigin = normalizeOrigin(origin);
        const resPre = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"](null, {
            status: 204
        });
        resPre.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
        resPre.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resPre.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        resPre.headers.set("Access-Control-Allow-Credentials", "true");
        return resPre;
    }
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // CORS em rotas /api
    if (req.nextUrl.pathname.startsWith("/api")) {
        const origin = req.headers.get("origin") || FRONTEND_ORIGIN;
        const normalizedOrigin = normalizeOrigin(origin);
        res.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
        res.headers.set("Access-Control-Allow-Credentials", "true");
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Proteção /dashboard
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
        try {
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://scsldapnrzpjkyqkeiop.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjc2xkYXBucnpwamt5cWtlaW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTYyMzksImV4cCI6MjA3MTEzMjIzOX0.TxRPb6uaLdCCBdjvjKOghvaD7EBPlA2rZqTfh8gPdBw"), {
                cookies: {
                    getAll: ()=>req.cookies.getAll(),
                    setAll: (cookiesToSet)=>{
                        cookiesToSet.forEach(({ name, value, options })=>res.cookies.set(name, value, {
                                ...options || {},
                                path: "/"
                            }));
                    }
                }
            });
            const { data } = await supabase.auth.getUser();
            if (!data?.user) {
                const loginUrl = new URL("/login", req.url);
                loginUrl.searchParams.set("next", req.nextUrl.pathname + (req.nextUrl.search || ""));
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
            }
        } catch  {
        // fail-open
        }
    }
    return res;
}
const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/:path*"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f2b15f93._.js.map