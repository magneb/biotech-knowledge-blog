import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { getSanityReadToken } from "./token";

const token = getSanityReadToken() || false;

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken: token,
});
