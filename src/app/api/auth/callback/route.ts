import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as any) || "email";
  const next = searchParams.get("next") ?? "/";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const redirectBase = forwardedHost ? `https://${forwardedHost}` : origin;
  const response = NextResponse.redirect(`${redirectBase}${next}`);

  const supabase = createServerClient(
    'https://gbdwswfrscjccaaeciiu.supabase.co',
    'sb_publishable_WCo_qddtShwOHZQGhsPwdg_nwgydoqr',
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get("cookie") || "";
          return cookieHeader.split(";").map(c => {
            const [name, ...val] = c.trim().split("=");
            return { name: name.trim(), value: val.join("=") };
          }).filter(c => c.name);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return response;
    }
  }

  // If there is an error or no code/token_hash, redirect to home page
  return NextResponse.redirect(`${origin}/`);
}
