"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./GlobalHeader.module.css";

function SearchFormInner() {
  const searchParams = useSearchParams();
  const q = searchParams?.get("q") || "";
  const scope = searchParams?.get("scope") || "all";

  return (
    <form action="/contents" method="GET" role="search" className={styles.searchForm}>
      <span className={styles.searchIconWrapper} aria-hidden="true">
        <Icon name="search" size={16} />
      </span>

      <input
        type="search"
        name="q"
        defaultValue={q}
        key={`q-${q}`}
        placeholder="Search protocols, guides, apparatus..."
        aria-label="Search the compendium"
        className={styles.searchInput}
      />

      <select
        name="scope"
        defaultValue={scope}
        key={`scope-${scope}`}
        aria-label="Filter search scope"
        className={styles.scopeSelect}
      >
        <option value="all">All</option>
        <option value="protocol">Protocols</option>
        <option value="guide">Guides</option>
        <option value="article">Articles</option>
        <option value="research-note">Notes</option>
      </select>

      <button type="submit" aria-label="Submit Search" className={styles.searchSubmitBtn}>
        <Icon name="arrow-right" size={14} />
      </button>
    </form>
  );
}

export function HeaderSearchForm() {
  return (
    <Suspense
      fallback={
        <form action="/contents" method="GET" role="search" className={styles.searchForm}>
          <span className={styles.searchIconWrapper} aria-hidden="true">
            <Icon name="search" size={16} />
          </span>
          <input
            type="search"
            name="q"
            placeholder="Search protocols, guides, apparatus..."
            aria-label="Search the compendium"
            className={styles.searchInput}
          />
          <select name="scope" aria-label="Filter search scope" className={styles.scopeSelect} defaultValue="all">
            <option value="all">All</option>
            <option value="protocol">Protocols</option>
            <option value="guide">Guides</option>
            <option value="article">Articles</option>
            <option value="research-note">Notes</option>
          </select>
          <button type="submit" aria-label="Submit Search" className={styles.searchSubmitBtn}>
            <Icon name="arrow-right" size={14} />
          </button>
        </form>
      }
    >
      <SearchFormInner />
    </Suspense>
  );
}
