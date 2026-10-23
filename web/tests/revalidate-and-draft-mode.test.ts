import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRevalidateTag,
  mockRevalidatePath,
  mockDraftModeDisable,
  mockDraftModeEnable,
  mockValidatePreviewUrl,
} = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockDraftModeDisable: vi.fn(),
  mockDraftModeEnable: vi.fn(),
  mockValidatePreviewUrl: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
  revalidatePath: mockRevalidatePath,
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

import { POST as revalidatePOST } from "@/app/api/revalidate/route";
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

describe("POST /api/revalidate (Sanity GROQ Webhook)", () => {
  const originalEnv = process.env.SANITY_REVALIDATE_SECRET;

  beforeEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = TEST_SECRET;
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
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

  it("returns 400 when signed payload lacks _type, path, and tags", async () => {
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

  it("verifies valid HMAC-SHA256 signature and invalidates document tags and paths", async () => {
    const body = JSON.stringify({
      _id: "art-123",
      _type: "article",
      slug: { current: "western-blot-guide" },
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
    expect(json.paths).toEqual(
      expect.arrayContaining(["/", "/western-blot-guide"])
    );

    expect(mockRevalidateTag).toHaveBeenCalledWith("sanity", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("article", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "article:western-blot-guide",
      "max"
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/western-blot-guide");
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
