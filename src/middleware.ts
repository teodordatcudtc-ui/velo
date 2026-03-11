import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Dacă Supabase a redirecționat OAuth pe /?code=... în loc de /auth/callback, trimite la callback
  const code = request.nextUrl.searchParams.get("code");
  if (request.nextUrl.pathname === "/" && code) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    url.searchParams.set("code", code);
    if (!url.searchParams.has("next")) url.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  // Protect dashboard routes
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isUpload = request.nextUrl.pathname.startsWith("/upload");

  if (isDashboard) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard/:path*"],
};
