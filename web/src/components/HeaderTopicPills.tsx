"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ElementalPill } from "@/components/ui/ElementalPill";
import styles from "./GlobalHeader.module.css";

export interface TopicItem {
  _id: string;
  name?: string | null;
  symbol?: string | null;
  slug?: { current?: string; source?: string } | null;
}

interface HeaderTopicPillsProps {
  topics: TopicItem[];
}

function TopicPillsInner({ topics }: HeaderTopicPillsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTopic = searchParams?.get("topic") || null;

  if (!topics || topics.length === 0) return null;

  // Determine base target path: keep user on /contents if they are already on /contents, else route to /
  const basePath = pathname === "/contents" ? "/contents" : "/";

  return (
    <div className={styles.topicRowContainer}>
      <nav className={styles.topicRow} aria-label="Topic taxonomies">
        {currentTopic && (
          <div className={styles.activeTopicTag}>
            <span>Filter:</span>
            <Link href={basePath} className={styles.clearFilterLink} title="Clear topic filter">
              [ ALL ✕ ]
            </Link>
          </div>
        )}

        {topics.map((topic) => {
          const slug = topic.slug?.current;
          if (!slug || !topic.symbol) return null;

          const isActive = currentTopic === slug;
          // Toggle off if already active, otherwise activate
          const targetHref = isActive ? basePath : `${basePath}?topic=${encodeURIComponent(slug)}`;

          return (
            <ElementalPill
              key={topic._id}
              symbol={topic.symbol}
              label={topic.name || undefined}
              size="sm"
              href={targetHref}
              active={isActive}
              aria-label={topic.name ? `${topic.symbol} - ${topic.name}` : topic.symbol}
            />
          );
        })}
      </nav>
    </div>
  );
}

export function HeaderTopicPills({ topics }: HeaderTopicPillsProps) {
  return (
    <Suspense
      fallback={
        <div className={styles.topicRowContainer}>
          <div className={styles.topicRow}>
            {topics?.map((topic) => (
              <ElementalPill
                key={topic._id}
                symbol={topic.symbol || "??"}
                label={topic.name || undefined}
                size="sm"
                href={`/?topic=${topic.slug?.current || ""}`}
              />
            ))}
          </div>
        </div>
      }
    >
      <TopicPillsInner topics={topics} />
    </Suspense>
  );
}
