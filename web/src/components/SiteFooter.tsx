import { defineQuery, stegaClean } from "next-sanity";
import { sanityFetch } from "@/sanity/live";

import { Icon } from "@/components/ui/Icon";

const FOOTER_QUERY = defineQuery(
  `*[_id == "homePage"][0]{ contactEmail }`
);

type FooterLink = { label: string; href: string };

/**
 * Global site footer: ✦ rule, link row, and site name.
 *
 * Only links with a working destination are rendered. Register, Log in,
 * QnA and About (from the mockup) are added here once their pages/auth exist.
 */
export default async function SiteFooter() {
  const { data } = await sanityFetch({
    query: FOOTER_QUERY,
  });

  const links: FooterLink[] = [];
  const cleanEmail = stegaClean(data?.contactEmail);
  if (cleanEmail) {
    links.push({ label: "Contact", href: `mailto:${cleanEmail}` });
  }

  // Resolved at render time (build time under static export, request/cache time under SSR).
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="ornament site-footer-rule" aria-hidden="true">
        <Icon name="star-four" size={16} />
      </div>

      {links.length > 0 && (
        <nav aria-label="Footer">
          <ul className="site-footer-links">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <p className="site-footer-name">
        Oliver&rsquo;s Guide To Everything &middot; &copy; {year}
      </p>
    </footer>
  );
}
