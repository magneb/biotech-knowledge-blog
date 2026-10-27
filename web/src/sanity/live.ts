import { draftMode } from "next/headers";
import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { getSanityReadToken } from "./token";

const token = getSanityReadToken() || false;
const isDev = process.env.NODE_ENV === "development";

const { sanityFetch: liveSanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken: token,
});

export { SanityLive };

export const sanityFetch: typeof liveSanityFetch = async function sanityFetch(
  args
) {
  if (isDev) {
    // In development: never cache! Always fetch fresh content directly from Sanity API.
    const resolvedParams = args.params ? await args.params : {};
    const { isEnabled: isDraftMode } = await draftMode().catch(() => ({
      isEnabled: false,
    }));
    const perspective =
      args.perspective ?? (isDraftMode ? "drafts" : "published");

    const data = await client
      .withConfig({ useCdn: false })
      .fetch(args.query, resolvedParams, {
        perspective,
        stega: args.stega ?? isDraftMode,
        token: token || undefined,
        cache: "no-store",
        next: { revalidate: 0 },
      });

    return {
      data: data as Awaited<ReturnType<typeof liveSanityFetch>>["data"],
      sourceMap: null,
      tags: [],
    };
  }

  return liveSanityFetch(args);
};
