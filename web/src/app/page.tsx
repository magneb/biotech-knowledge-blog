import { client } from "@/sanity/client";
import { PortableText, defineQuery, type SanityDocument } from "next-sanity";
import Link from "next/link";

const HOME_QUERY = defineQuery(`*[_id == "homePage"][0]{ heading, subheading, intro }`);

const ARTICLES_QUERY = defineQuery(
  `*[_type == "article" && defined(slug.current)] | order(publishedAt desc){
    _id, title, slug, summary, category, publishedAt
  }`
);

const options = { next: { revalidate: 30 } };

export default async function HomePage() {
  const [home, articles] = await Promise.all([
    client.fetch<SanityDocument | null>(HOME_QUERY, {}, options),
    client.fetch<SanityDocument[]>(ARTICLES_QUERY, {}, options),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {(home?.heading as string) || "Oliver\u2019s Guide To Everything"}
          </h1>
          {(home?.subheading || !home) && (
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              {(home?.subheading as string) ||
                "Biotech & cancer research protocols"}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {home?.intro && Array.isArray(home.intro) && (
          <div className="prose prose-zinc dark:prose-invert mb-10 max-w-none">
            <PortableText value={home.intro} />
          </div>
        )}

        {articles.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No articles yet. Add some in the Studio.
          </p>
        ) : (
          <ul className="space-y-8">
            {articles.map((article) => (
              <li key={article._id}>
                <Link
                  href={`/${(article.slug as { current?: string })?.current}`}
                  className="group block"
                >
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
                      {article.title as string}
                    </h2>
                    {article.category && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {article.category as string}
                      </span>
                    )}
                  </div>
                  {article.summary && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {article.summary as string}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
