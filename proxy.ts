import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
