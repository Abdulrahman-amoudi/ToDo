import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  // If there is an error or no code, redirect to home page
  return NextResponse.redirect(`${origin}/`);
}
