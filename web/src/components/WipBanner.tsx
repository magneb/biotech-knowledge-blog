import { sanityFetch } from "@/sanity/live";
import { WIP_BANNER_QUERY } from "@/sanity/siteSettings";
import { WipBannerClient } from "./WipBannerClient";

export default async function WipBanner() {
  const { data } = await sanityFetch({
    query: WIP_BANNER_QUERY,
  }).catch(() => ({ data: null }));

  const enabled = data?.wipBannerEnabled ?? true;
  const text =
    data?.wipBannerText ||
    "Work in Progress — Oliver's Guide is actively being penned and curated. Protocols may undergo revision.";

  if (!enabled || !text.trim()) {
    return null;
  }

  return <WipBannerClient text={text} />;
}
