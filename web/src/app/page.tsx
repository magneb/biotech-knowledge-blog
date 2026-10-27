import type { HOME_PAGE_QUERY_RESULT } from "../../sanity.types";
import { sanityFetch } from "@/sanity/live";
import { HOME_PAGE_QUERY } from "@/sanity/queries";
import { HomeFrontispiece } from "@/components/HomeFrontispiece";

export { HOME_PAGE_QUERY };

export interface HomePageProps {
  searchParams?: Promise<{
    topic?: string;
  }>;
  initialTopic?: string;
}

export default async function HomePage(props: HomePageProps = {}) {
  let initialTopic = props.initialTopic;
  if (!initialTopic && props.searchParams) {
    const resolved = await props.searchParams;
    initialTopic = resolved.topic;
  }

  const { data } = await sanityFetch({ query: HOME_PAGE_QUERY }).catch(
    (err) => {
      console.warn("Unable to fetch home page data from Sanity:", err);
      return { data: null };
    }
  );

  return (
    <HomeFrontispiece
      data={data as HOME_PAGE_QUERY_RESULT | null}
      initialTopic={initialTopic}
    />
  );
}
