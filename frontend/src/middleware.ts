import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // If hitting root on specific ports, route directly to that app's dedicated view
  if (pathname === "/") {
    if (host.includes(":3001")) {
      return NextResponse.rewrite(new URL("/parents", request.url));
    }
    if (host.includes(":3002")) {
      return NextResponse.rewrite(new URL("/k12", request.url));
    }
    if (host.includes(":3003")) {
      return NextResponse.rewrite(new URL("/college", request.url));
    }
    if (host.includes(":3004")) {
      return NextResponse.rewrite(new URL("/driver", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
