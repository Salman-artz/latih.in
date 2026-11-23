import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "latih_session";

// Halaman yang membutuhkan login
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/redeem",
  "/materi",
  "/tryout",
  "/riwayat",
  "/profil",
  "/admin",
];

// Halaman khusus auth (tamu)
const AUTH_ROUTES = ["/login", "/register"];

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || "default_jwt_secret_must_be_set_in_env_file";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isValidSession = false;
  let userRole = "USER";

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      if (payload && payload.userId) {
        isValidSession = true;
        userRole = (payload.role as string) || "USER";
      }
    } catch {
      isValidSession = false;
    }
  }

  // 1. Jika pengguna sudah login dan mengakses /login atau /register -> redirect ke /dashboard
  if (isValidSession && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Jika mengakses rute terproteksi tanpa sesi valid -> redirect ke /login
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isValidSession && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Jika mengakses /admin di browser tapi role di token bukan ADMIN -> redirect /dashboard
  if (isValidSession && pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/redeem/:path*",
    "/materi/:path*",
    "/tryout/:path*",
    "/riwayat/:path*",
    "/profil/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
