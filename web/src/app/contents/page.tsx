import type { Metadata } from "next";

import type { CONTENTS_PAGE_QUERY_RESULT } from "../../../sanity.types";
import { sanityFetch } from "@/sanity/live";
import { CONTENTS_PAGE_QUERY } from "@/sanity/queries";
import {
  ContentsCompendium,
  type ContentsFilterParams,
} from "@/components/ContentsCompendium";

export const metadata: Metadata = {
  title: "Master Table of Contents | Oliver's Guide To Everything",
  description:
    "A systematic compendium of laboratory protocols, research guides, and scientific investigations arranged by chapter.",
};

export { CONTENTS_PAGE_QUERY };

export interface ContentsPageProps {
  searchParams?: Promise<ContentsFilterParams>;
  initialParams?: ContentsFilterParams;
}

export default async function ContentsPage(props: ContentsPageProps = {}) {
  let initialParams = props.initialParams;
  if (!initialParams && props.searchParams) {
    initialParams = await props.searchParams;
  }

  const { data } = await sanityFetch({
    query: CONTENTS_PAGE_QUERY,
  }).catch((err) => {
    console.warn("Unable to fetch contents data from Sanity:", err);
    return { data: null };
  });

  return (
    <ContentsCompendium
      data={data as CONTENTS_PAGE_QUERY_RESULT | null}
      initialParams={initialParams}
    />
  );
}
