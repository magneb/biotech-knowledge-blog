import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

export type RevalidateWebhookPayload = {
  _id?: string;
  _type?: string;
  slug?: { current?: string } | string | null;
  tags?: string[];
  path?: string;
};

function resolveSlug(
  slug: RevalidateWebhookPayload["slug"]
): string | undefined {
  if (!slug) return undefined;
  if (typeof slug === "string") return slug.trim() || undefined;
  if (typeof slug === "object" && typeof slug.current === "string") {
    return slug.current.trim() || undefined;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    if (!secret || !secret.trim()) {
      return NextResponse.json(
        { message: "Missing SANITY_REVALIDATE_SECRET environment variable" },
        { status: 500 }
      );
    }

    const waitForConsistency = process.env.NODE_ENV === "production";
    const { isValidSignature, body } =
      await parseBody<RevalidateWebhookPayload>(
        req,
        secret,
        waitForConsistency
      );

    if (!isValidSignature) {
      return NextResponse.json(
        { message: "Invalid webhook signature", isValidSignature: false },
        { status: 401 }
      );
    }

    if (!body || (!body._type && !body.path && !Array.isArray(body.tags))) {
      return NextResponse.json(
        { message: "Bad request: missing _type, path, or tags in payload" },
        { status: 400 }
      );
    }

    const revalidatedTags = new Set<string>(["sanity"]);
    const revalidatedPaths = new Set<string>(["/"]);

    if (Array.isArray(body.tags)) {
      for (const tag of body.tags) {
        if (typeof tag === "string" && tag.trim()) {
          revalidatedTags.add(tag.trim());
        }
      }
    }

    if (typeof body._type === "string" && body._type.trim()) {
      revalidatedTags.add(body._type.trim());
    }

    if (typeof body._id === "string" && body._id.trim()) {
      revalidatedTags.add(body._id.trim());
    }

    const slug = resolveSlug(body.slug);
    if (slug) {
      if (body._type) {
        revalidatedTags.add(`${body._type}:${slug}`);
      }
      revalidatedPaths.add(`/${slug}`);
    }

    if (
      typeof body.path === "string" &&
      body.path.startsWith("/") &&
      !body.path.startsWith("//")
    ) {
      revalidatedPaths.add(body.path);
    }

    for (const tag of revalidatedTags) {
      revalidateTag(tag, "max");
    }

    for (const targetPath of revalidatedPaths) {
      revalidatePath(targetPath);
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      tags: Array.from(revalidatedTags),
      paths: Array.from(revalidatedPaths),
    });
  } catch (err) {
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Webhook revalidation failed",
      },
      { status: 500 }
    );
  }
}
