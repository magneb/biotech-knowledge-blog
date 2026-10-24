import { defineQuery, stegaClean } from "next-sanity";
import { sanityFetch } from "@/sanity/live";
import { Icon } from "@/components/ui/Icon";
import { FooterNavLinks } from "./FooterNavLinks";

const FOOTER_QUERY = defineQuery(
  `*[_id == "homePage"][0]{ contactEmail }`
);

/**
 * Global site footer: ✦ rule, full Victorian navigation links, and site name.
 */
export default async function SiteFooter() {
  const { data } = await sanityFetch({
    query: FOOTER_QUERY,
  }).catch((err) => {
    console.warn("Unable to fetch footer data from Sanity:", err);
    return { data: null };
  });

  const cleanEmail = stegaClean(data?.contactEmail);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="ornament site-footer-rule" aria-hidden="true">
        <Icon name="star-four" size={16} />
      </div>

      <FooterNavLinks contactEmail={cleanEmail} />

      <p className="site-footer-name">
        Oliver&rsquo;s Guide To Everything &middot; &copy; {year}
      </p>
    </footer>
  );
}
