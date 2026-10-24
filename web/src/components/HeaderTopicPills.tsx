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

interface TopicRowViewProps {
  topics: TopicItem[];
  currentTopic?: string | null;
  basePath: string;
}

function TopicRowView({ topics, currentTopic, basePath }: TopicRowViewProps) {
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

function TopicPillsWithParams({ topics }: HeaderTopicPillsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTopic = searchParams?.get("topic") || null;
  const basePath = pathname === "/contents" ? "/contents" : "/";

  return <TopicRowView topics={topics} currentTopic={currentTopic} basePath={basePath} />;
}

export function HeaderTopicPills({ topics }: HeaderTopicPillsProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <Suspense fallback={<TopicRowView topics={topics} basePath="/" />}>
      <TopicPillsWithParams topics={topics} />
    </Suspense>
  );
}
