import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "9bx84ykf",
  dataset: "production",
  apiVersion: "2026-09-29",
  useCdn: false,
});
