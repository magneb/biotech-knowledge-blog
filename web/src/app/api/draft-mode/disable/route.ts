import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const draftModeStore = await draftMode();
  draftModeStore.disable();

  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/";
  const safePath =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";

  return NextResponse.redirect(new URL(safePath, request.url));
}
