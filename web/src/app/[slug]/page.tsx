import { PortableText, defineQuery, type SanityDocument } from "next-sanity";
import { notFound } from "next/navigation";
import Link from "next/link";
import { client } from "@/sanity/client";

const ARTICLE_QUERY = defineQuery(
  `*[_type == "article" && slug.current == $slug][0]{
    _id, title, body, category, publishedAt
  }`
);

const options = { next: { revalidate: 30 } };

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await client.fetch<SanityDocument | null>(
    ARTICLE_QUERY,
    { slug },
    options
  );

  if (!article) return notFound();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article>
          <div className="mb-8">
            {article.category && (
              <span className="mb-2 inline-block rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {article.category as string}
              </span>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {article.title as string}
            </h1>
            {article.publishedAt && (
              <time className="mt-2 block text-sm text-zinc-500 dark:text-zinc-400">
                {new Date(article.publishedAt as string).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </time>
            )}
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {Array.isArray(article.body) && (
              <PortableText value={article.body} />
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
