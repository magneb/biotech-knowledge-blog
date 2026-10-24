"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./GlobalHeader.module.css";

interface SearchFormFieldsProps {
  initialQuery?: string;
  initialScope?: string;
}

function SearchFormFields({
  initialQuery = "",
  initialScope = "all",
}: SearchFormFieldsProps) {
  return (
    <form action="/contents" method="GET" role="search" className={styles.searchForm}>
      <span className={styles.searchIconWrapper} aria-hidden="true">
        <Icon name="search" size={16} />
      </span>

      <input
        type="search"
        name="q"
        defaultValue={initialQuery}
        key={`q-${initialQuery}`}
        placeholder="Search protocols, guides, apparatus..."
        aria-label="Search the compendium"
        className={styles.searchInput}
      />

      <select
        name="scope"
        defaultValue={initialScope}
        key={`scope-${initialScope}`}
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

function SearchFormWithParams() {
  const searchParams = useSearchParams();
  const q = searchParams?.get("q") || "";
  const scope = searchParams?.get("scope") || "all";

  return <SearchFormFields initialQuery={q} initialScope={scope} />;
}

export function HeaderSearchForm() {
  return (
    <Suspense fallback={<SearchFormFields />}>
      <SearchFormWithParams />
    </Suspense>
  );
}
