import { defineQuery } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/sanity/live";
import { HeaderDrawer } from "./HeaderDrawer";
import { HeaderSearchForm } from "./HeaderSearchForm";
import { HeaderTopicPills } from "./HeaderTopicPills";
import { HeaderUtilities } from "./HeaderUtilities";
import styles from "./GlobalHeader.module.css";

export const NAVIGATION_QUERY = defineQuery(
  `{
    "topics": *[_type == "topic"] | order(name asc){
      _id,
      name,
      symbol,
      slug
    },
    "chapters": *[_type == "chapter"] | order(number asc){
      _id,
      title,
      number,
      slug,
      "articles": *[_type == "article" && references(^._id) && defined(slug.current)] | order(chapterOrder asc, publishedAt desc){
        _id,
        title,
        slug,
        contentType
      }
    }
  }`
);

export default async function GlobalHeader() {
  const { data } = await sanityFetch({
    query: NAVIGATION_QUERY,
  }).catch((err) => {
    console.warn("Unable to fetch navigation data from Sanity:", err);
    return { data: null };
  });

  const topics = data?.topics ?? [];
  const chapters = data?.chapters ?? [];

  return (
    <header className={styles.headerContainer}>
      <div className={styles.topRow}>
        <div className={styles.leftGroup}>
          <HeaderDrawer chapters={chapters} topics={topics} />
          <Link href="/" className={styles.logoLink} title="Oliver's Guide To Everything">
            <Image
              src="/art/brand/olivers-cartouche.svg"
              alt="Oliver's Guide to Everything"
              width={240}
              height={100}
              className={styles.logoImage}
              priority
            />
          </Link>
        </div>

        <div className={styles.rightGroup}>
          <HeaderSearchForm />
          <HeaderUtilities />
        </div>
      </div>

      <HeaderTopicPills topics={topics} />
    </header>
  );
}
