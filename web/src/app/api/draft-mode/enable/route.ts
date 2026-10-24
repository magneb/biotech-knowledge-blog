import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/client";
import { getSanityReadToken } from "@/sanity/token";

export async function GET(request: Request) {
  const token = getSanityReadToken();

  const { GET: handleDraftMode } = defineEnableDraftMode({
    client: client.withConfig({
      token: token || "",
    }),
  });

  return handleDraftMode(request);
}
