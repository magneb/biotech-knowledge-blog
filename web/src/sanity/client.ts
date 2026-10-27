import { createClient } from "next-sanity";

const studioUrl =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "http://localhost:3333";

export const client = createClient({
  projectId: "9bx84ykf",
  dataset: "production",
  apiVersion: "2026-09-29",
  useCdn: process.env.NODE_ENV === "production",
  stega: {
    studioUrl,
  },
});

