import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { client } from "@/sanity/client";

export type RevalidateWebhookPayload = {
  _id?: string;
  _type?: string;
  slug?: { current?: string } | string | null;
  previousSlug?: { current?: string } | string | null;
  versionNumber?: number | null;
  articleRef?: string | null;
  articleSlug?: string | null;
  article?: { _ref?: string; slug?: { current?: string } | string | null } | null;
  tags?: string[];
  path?: string;
  purgeAll?: boolean;
};

/**
 * Constant-time secret comparison via Web Crypto API (SHA-256 + timingSafeEqual).
 * Hashing both values to a fixed 32-byte digest eliminates length-leak timing attacks.
 */
export async function verifySecret(provided: string, expected: string): Promise<boolean> {
  if (typeof provided !== "string" || typeof expected !== "string" || !provided.trim() || !expected.trim()) {
    return false;
  }
  const enc = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const subtle = crypto.subtle as { timingSafeEqual?: (a: ArrayBuffer, b: ArrayBuffer) => boolean };
  if (typeof subtle.timingSafeEqual === "function") {
    return subtle.timingSafeEqual(providedHash, expectedHash);
  }
  // Constant-time XOR fallback for Node.js / Vitest test environments
  const u8A = new Uint8Array(providedHash);
  const u8B = new Uint8Array(expectedHash);
  if (u8A.byteLength !== u8B.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < u8A.byteLength; i++) diff |= u8A[i] ^ u8B[i];
  return diff === 0;
}

function resolveSlug(slug: RevalidateWebhookPayload["slug"]): string | undefined {
  if (!slug) return undefined;
  if (typeof slug === "string") return slug.trim() || undefined;
  if (typeof slug === "object" && typeof slug.current === "string") return slug.current.trim() || undefined;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    if (!secret || !secret.trim()) {
      return NextResponse.json({ message: "Missing SANITY_REVALIDATE_SECRET environment variable" }, { status: 500 });
    }

    let body: RevalidateWebhookPayload | null = null;
    const authHeader = req.headers.get("x-revalidate-secret") || req.headers.get("authorization");

    // 1. Authenticate via Bearer / Header secret or Sanity HMAC signature
    if (authHeader && authHeader.trim()) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      const isValid = await verifySecret(token, secret.trim());
      if (!isValid) return NextResponse.json({ message: "Invalid authorization token" }, { status: 401 });
      body = (await req.json().catch(() => null)) as RevalidateWebhookPayload | null;
    } else {
      const waitForConsistency = process.env.NODE_ENV === "production";
      const parsed = await parseBody<RevalidateWebhookPayload>(req, secret, waitForConsistency);
      if (!parsed.isValidSignature) {
        return NextResponse.json({ message: "Invalid webhook signature", isValidSignature: false }, { status: 401 });
      }
      body = parsed.body;
    }

    if (!body || (!body.purgeAll && !body._type && !body.path && !Array.isArray(body.tags))) {
      return NextResponse.json({ message: "Bad request: missing _type, path, tags, or purgeAll in payload" }, { status: 400 });
    }

    const revalidatedTags = new Set<string>(["sanity"]);
    const revalidatedPaths = new Set<string>(["/"]);

    // 2. Authenticated Full Cache Purge
    if (body.purgeAll === true) {
      const masterTags = ["sanity", "article", "articleVersion", "chapter", "topic", "homePage", "aboutPage", "siteSettings"];
      for (const tag of masterTags) revalidateTag(tag, "max");
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/contents");
      return NextResponse.json({ revalidated: true, purgedAll: true, now: Date.now(), tags: masterTags, paths: ["/", "/contents", "/* (layout)"] });
    }

    // 3. Global Singletons & Taxonomies -> Layout Revalidation
    const layoutTypes = ["siteSettings", "homePage", "aboutPage", "chapter", "topic"];
    if (body._type && layoutTypes.includes(body._type)) {
      revalidatePath("/", "layout");
      revalidatedPaths.add("/contents");
    }

    // 4. Custom Tags and Types
    if (Array.isArray(body.tags)) {
      for (const tag of body.tags) if (typeof tag === "string" && tag.trim()) revalidatedTags.add(tag.trim());
    }
    if (typeof body._type === "string" && body._type.trim()) revalidatedTags.add(body._type.trim());
    if (typeof body._id === "string" && body._id.trim()) revalidatedTags.add(body._id.trim());

    // 5. Article Document Revalidation
    if (body._type === "article") {
      revalidatedPaths.add("/contents");
      const currentSlug = resolveSlug(body.slug);
      const prevSlug = resolveSlug(body.previousSlug);
      const slugsToRevalidate = [currentSlug, prevSlug].filter((s): s is string => Boolean(s));

      for (const s of slugsToRevalidate) {
        revalidatedTags.add(`article:${s}`);
        revalidatedPaths.add(`/${s}`);
        revalidatedPaths.add(`/${s}/versions`);
        const maxVersion = typeof body.versionNumber === "number" && body.versionNumber > 0
          ? Math.max(1, Math.min(Math.floor(body.versionNumber), 50))
          : 1;
        for (let v = 1; v <= maxVersion; v++) revalidatedPaths.add(`/${s}/v${v}`);
      }
    }

    // 6. ArticleVersion Document Revalidation
    if (body._type === "articleVersion") {
      revalidatedPaths.add("/contents");
      let parentSlug = body.articleSlug || resolveSlug(body.article?.slug) || resolveSlug(body.slug);
      let versionNum = typeof body.versionNumber === "number" ? body.versionNumber : undefined;

      if (!parentSlug) {
        const parentRef = body.articleRef || body.article?._ref;
        if (parentRef) {
          const parent = await client.withConfig({ useCdn: false })
            .fetch<{ slug?: string; versionNumber?: number } | null>(
              `*[_type == "article" && _id == $ref][0]{ "slug": slug.current, versionNumber }`,
              { ref: parentRef }
            ).catch(() => null);
          if (parent?.slug) {
            parentSlug = parent.slug;
            if (versionNum === undefined) versionNum = parent.versionNumber;
          }
        }
      }

      if (parentSlug) {
        revalidatedTags.add(`article:${parentSlug}`);
        revalidatedPaths.add(`/${parentSlug}`);
        revalidatedPaths.add(`/${parentSlug}/versions`);
        if (typeof versionNum === "number" && versionNum > 0) {
          revalidatedTags.add(`articleVersion:${versionNum}`);
          revalidatedPaths.add(`/${parentSlug}/v${versionNum}`);
        }
      }
    }

    // 7. Explicit Path Parameter
    if (typeof body.path === "string" && body.path.startsWith("/") && !body.path.startsWith("//")) {
      revalidatedPaths.add(body.path);
    }

    // 8. Execute Next.js Cache Invalidation
    for (const tag of revalidatedTags) revalidateTag(tag, "max");
    for (const targetPath of revalidatedPaths) revalidatePath(targetPath);

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      tags: Array.from(revalidatedTags),
      paths: Array.from(revalidatedPaths),
    });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Webhook revalidation failed" },
      { status: 500 }
    );
  }
}
