import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRevalidateTag,
  mockRevalidatePath,
  mockDraftModeDisable,
  mockDraftModeEnable,
  mockValidatePreviewUrl,
  mockClientFetch,
} = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockDraftModeDisable: vi.fn(),
  mockDraftModeEnable: vi.fn(),
  mockValidatePreviewUrl: vi.fn(),
  mockClientFetch: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/sanity/client", () => ({
  client: {
    withConfig: vi.fn(() => ({
      fetch: mockClientFetch,
    })),
    fetch: mockClientFetch,
  },
}));

vi.mock("next/headers", () => ({
  draftMode: vi.fn(async () => ({
    isEnabled: false,
    enable: mockDraftModeEnable,
    disable: mockDraftModeDisable,
  })),
  cookies: vi.fn(async () => ({
    get: vi.fn(() => ({ value: "bypass-token" })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("@sanity/preview-url-secret", () => ({
  validatePreviewUrl: mockValidatePreviewUrl,
}));

import { POST as revalidatePOST, verifySecret } from "@/app/api/revalidate/route";
import { GET as disableDraftModeGET } from "@/app/api/draft-mode/disable/route";
import { GET as enableDraftModeGET } from "@/app/api/draft-mode/enable/route";

const TEST_SECRET = "test-webhook-revalidate-secret-key";

async function signWebhookPayload(
  payload: string,
  secret: string,
  timestamp = Date.now()
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signaturePayload = `${timestamp}.${payload}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(signaturePayload)
  );
  const signatureArray = Array.from(new Uint8Array(signature));
  const base64Url = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `t=${timestamp},v1=${base64Url}`;
}

describe("verifySecret (Constant-Time Token Verification)", () => {
  it("returns true for matching secrets", async () => {
    expect(await verifySecret(TEST_SECRET, TEST_SECRET)).toBe(true);
    expect(await verifySecret("short", "short")).toBe(true);
  });

  it("returns false for mismatching secrets", async () => {
    expect(await verifySecret("wrong-secret", TEST_SECRET)).toBe(false);
  });

  it("returns false for empty, whitespace, or invalid types without throwing", async () => {
    expect(await verifySecret("", TEST_SECRET)).toBe(false);
    expect(await verifySecret("   ", TEST_SECRET)).toBe(false);
    expect(await verifySecret("short", "much-longer-expected-secret")).toBe(false);
    expect(await verifySecret(null as unknown as string, TEST_SECRET)).toBe(false);
    expect(await verifySecret(undefined as unknown as string, TEST_SECRET)).toBe(false);
  });
});

describe("POST /api/revalidate (Sanity GROQ Webhook & CLI Invalidation)", () => {
  const originalEnv = process.env.SANITY_REVALIDATE_SECRET;

  beforeEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = TEST_SECRET;
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    mockClientFetch.mockReset();
  });

  afterEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = originalEnv;
  });

  it("returns 500 when SANITY_REVALIDATE_SECRET is not configured", async () => {
    delete process.env.SANITY_REVALIDATE_SECRET;
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ _type: "article" }),
    });

    const res = await revalidatePOST(req);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { message: string };
    expect(json.message).toContain("SANITY_REVALIDATE_SECRET");
  });

  it("returns 401 when sanity-webhook-signature header is missing or invalid", async () => {
    const body = JSON.stringify({
      _id: "art-1",
      _type: "article",
      slug: { current: "crispr-protocol" },
    });

    // Missing header
    const unsignedReq = new NextRequest(
      "http://localhost:3000/api/revalidate",
      {
        method: "POST",
        body,
      }
    );
    const unsignedRes = await revalidatePOST(unsignedReq);
    expect(unsignedRes.status).toBe(401);

    // Wrong secret signature
    const badSignature = await signWebhookPayload(body, "wrong-secret");
    const badSigReq = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: { "sanity-webhook-signature": badSignature },
      body,
    });
    const badSigRes = await revalidatePOST(badSigReq);
    expect(badSigRes.status).toBe(401);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("authenticates via Bearer token and returns 401 on invalid token", async () => {
    const body = JSON.stringify({ _type: "siteSettings" });
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong-token",
      },
      body,
    });

    const res = await revalidatePOST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when signed payload lacks _type, path, tags, and purgeAll", async () => {
    const body = JSON.stringify({ foo: "bar" });
    const signature = await signWebhookPayload(body, TEST_SECRET);
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: { "sanity-webhook-signature": signature },
      body,
    });

    const res = await revalidatePOST(req);
    expect(res.status).toBe(400);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("handles authenticated { purgeAll: true } with full layout and master tag purge", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TEST_SECRET}`,
      },
      body: JSON.stringify({ purgeAll: true }),
    });

    const res = await revalidatePOST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      revalidated: boolean;
      purgedAll: boolean;
      tags: string[];
      paths: string[];
    };

    expect(json.revalidated).toBe(true);
    expect(json.purgedAll).toBe(true);
    expect(json.paths).toEqual(["/", "/contents", "/* (layout)"]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/contents");

    const expectedMasterTags = [
      "sanity",
      "article",
      "articleVersion",
      "chapter",
      "topic",
      "homePage",
      "aboutPage",
      "siteSettings",
    ];
    for (const tag of expectedMasterTags) {
      expect(mockRevalidateTag).toHaveBeenCalledWith(tag, "max");
    }
  });

  it("triggers layout invalidation on singletons and taxonomies", async () => {
    for (const singleType of ["siteSettings", "homePage", "aboutPage", "chapter", "topic"]) {
      mockRevalidatePath.mockClear();
      mockRevalidateTag.mockClear();

      const req = new NextRequest("http://localhost:3000/api/revalidate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": TEST_SECRET,
        },
        body: JSON.stringify({ _type: singleType }),
      });

      const res = await revalidatePOST(req);
      expect(res.status).toBe(200);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/contents");
      expect(mockRevalidateTag).toHaveBeenCalledWith(singleType, "max");
    }
  });

  it("revalidates full article graph including permalinks and contents", async () => {
    const body = JSON.stringify({
      _id: "art-123",
      _type: "article",
      slug: { current: "western-blot-guide" },
      versionNumber: 3,
      tags: ["s1:syncTagA"],
    });
    const signature = await signWebhookPayload(body, TEST_SECRET);
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "sanity-webhook-signature": signature,
      },
      body,
    });

    const res = await revalidatePOST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      revalidated: boolean;
      tags: string[];
      paths: string[];
    };

    expect(json.revalidated).toBe(true);
    expect(json.tags).toEqual(
      expect.arrayContaining([
        "sanity",
        "article",
        "art-123",
        "article:western-blot-guide",
        "s1:syncTagA",
      ])
    );

    // Full graph paths
    expect(json.paths).toEqual(
      expect.arrayContaining([
        "/",
        "/contents",
        "/western-blot-guide",
        "/western-blot-guide/versions",
        "/western-blot-guide/v1",
        "/western-blot-guide/v2",
        "/western-blot-guide/v3",
      ])
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/contents");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/western-blot-guide");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/western-blot-guide/versions");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/western-blot-guide/v1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/western-blot-guide/v2");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/western-blot-guide/v3");
  });

  it("handles article slug mutation by revalidating previousSlug and current slug", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TEST_SECRET}`,
      },
      body: JSON.stringify({
        _type: "article",
        slug: { current: "new-pcr-protocol" },
        previousSlug: { current: "old-pcr-protocol" },
        versionNumber: 2,
      }),
    });

    const res = await revalidatePOST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { paths: string[]; tags: string[] };

    expect(json.paths).toEqual(
      expect.arrayContaining([
        "/new-pcr-protocol",
        "/new-pcr-protocol/versions",
        "/new-pcr-protocol/v1",
        "/new-pcr-protocol/v2",
        "/old-pcr-protocol",
        "/old-pcr-protocol/versions",
        "/old-pcr-protocol/v1",
        "/old-pcr-protocol/v2",
      ])
    );
    expect(json.tags).toEqual(
      expect.arrayContaining([
        "article:new-pcr-protocol",
        "article:old-pcr-protocol",
      ])
    );
  });

  it("handles articleVersion revalidation with direct articleSlug in payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TEST_SECRET}`,
      },
      body: JSON.stringify({
        _type: "articleVersion",
        articleSlug: "crispr-cas9",
        versionNumber: 4,
      }),
    });

    const res = await revalidatePOST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { paths: string[]; tags: string[] };

    expect(json.paths).toEqual(
      expect.arrayContaining([
        "/contents",
        "/crispr-cas9",
        "/crispr-cas9/versions",
        "/crispr-cas9/v4",
      ])
    );
    expect(json.tags).toEqual(
      expect.arrayContaining(["article:crispr-cas9", "articleVersion:4"])
    );
  });

  it("handles articleVersion revalidation by resolving parent slug via Sanity client", async () => {
    mockClientFetch.mockResolvedValueOnce({
      slug: "crispr-cas9-lake",
      versionNumber: 5,
    });

    const req = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TEST_SECRET}`,
      },
      body: JSON.stringify({
        _type: "articleVersion",
        articleRef: "parent-article-id-999",
      }),
    });

    const res = await revalidatePOST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { paths: string[]; tags: string[] };

    expect(mockClientFetch).toHaveBeenCalledTimes(1);
    expect(json.paths).toEqual(
      expect.arrayContaining([
        "/contents",
        "/crispr-cas9-lake",
        "/crispr-cas9-lake/versions",
        "/crispr-cas9-lake/v5",
      ])
    );
    expect(json.tags).toEqual(
      expect.arrayContaining(["article:crispr-cas9-lake", "articleVersion:5"])
    );
  });
});

describe("Draft Mode Route Handlers (/api/draft-mode/enable & /api/draft-mode/disable)", () => {
  beforeEach(() => {
    mockDraftModeDisable.mockClear();
    mockDraftModeEnable.mockClear();
    mockValidatePreviewUrl.mockReset();
  });

  it("GET /api/draft-mode/enable returns 401 when preview secret is invalid", async () => {
    mockValidatePreviewUrl.mockResolvedValueOnce({ isValid: false });
    const req = new Request(
      "http://localhost:3000/api/draft-mode/enable?sanity-preview-secret=bad"
    );

    const res = await enableDraftModeGET(req);
    expect(res.status).toBe(401);
    expect(mockDraftModeEnable).not.toHaveBeenCalled();
  });

  it("GET /api/draft-mode/disable disables draftMode and redirects safely", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/draft-mode/disable?redirect=/pcr-protocol"
    );

    const res = await disableDraftModeGET(req);
    expect(mockDraftModeDisable).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/pcr-protocol"
    );
  });

  it("GET /api/draft-mode/disable prevents open redirects to external origins", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/draft-mode/disable?redirect=//evil.example.com"
    );

    const res = await disableDraftModeGET(req);
    expect(mockDraftModeDisable).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });
});
