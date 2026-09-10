import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { LinkCheckResult, LinkStatusMap } from "@/lib/link-status";

export const runtime = "nodejs";

const MAX_URLS_PER_REQUEST = 50;
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_CONCURRENT_CHECKS = 5;
const USER_AGENT = "MeetingsViewerLinkChecker/1.0";

function isPrivateIp(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    return isPrivateIp(normalized.slice(7));
  }

  const version = isIP(normalized);
  if (version === 4) {
    const octets = normalized.split(".").map(Number);
    const [first, second] = octets;
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19))
    );
  }

  if (version === 6) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb") ||
      normalized.startsWith("ff")
    );
  }

  return true;
}

function normalizeHostname(hostname: string): string {
  return hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

async function validatePublicUrl(rawUrl: string): Promise<string> {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported URL protocol");
  }
  if (url.username || url.password) {
    throw new Error("URL credentials are not allowed");
  }

  const hostname = normalizeHostname(url.hostname);
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Private host is not allowed");
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Private host is not allowed");
  } else {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (
      !addresses.length ||
      addresses.some(({ address }) => isPrivateIp(address))
    ) {
      throw new Error("Private host is not allowed");
    }
  }

  return url.toString();
}

async function fetchWithRedirects(
  rawUrl: string,
  method: "HEAD" | "GET",
  signal: AbortSignal
): Promise<Response> {
  let currentUrl = await validatePublicUrl(rawUrl);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(currentUrl, {
      method,
      redirect: "manual",
      signal,
      headers: {
        "User-Agent": USER_AGENT,
        ...(method === "GET" ? { Range: "bytes=0-0" } : {}),
      },
    });

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get("location");
    if (!location) return response;
    currentUrl = await validatePublicUrl(
      new URL(location, currentUrl).toString()
    );
  }

  throw new Error("Too many redirects");
}

async function checkUrl(rawUrl: string): Promise<LinkCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response = await fetchWithRedirects(rawUrl, "HEAD", controller.signal);
    if (response.status === 405 || response.status === 501) {
      await response.body?.cancel();
      response = await fetchWithRedirects(rawUrl, "GET", controller.signal);
    }

    const status = response.status;
    await response.body?.cancel();

    if (status === 200) return { state: "ok", status };
    if (status === 404) return { state: "not-found", status };
    return { state: "http-error", status };
  } catch (error) {
    if (controller.signal.aborted) {
      return { state: "error", message: "Request timed out" };
    }
    if (
      error instanceof Error &&
      error.message === "Private host is not allowed"
    ) {
      return { state: "error", message: "Private host is not allowed" };
    }
    return { state: "error", message: "Request failed" };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkUrls(urls: string[]): Promise<LinkStatusMap> {
  const statuses: LinkStatusMap = {};
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < urls.length) {
      const index = nextIndex;
      nextIndex += 1;
      statuses[urls[index]] = await checkUrl(urls[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_CHECKS, urls.length) }, worker)
  );
  return statuses;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const urls =
    body &&
    typeof body === "object" &&
    "urls" in body &&
    Array.isArray(body.urls)
      ? body.urls
      : null;
  if (!urls || urls.some((url) => typeof url !== "string")) {
    return Response.json({ error: "Expected a urls array" }, { status: 400 });
  }

  const uniqueUrls = [...new Set(urls)];
  if (uniqueUrls.length > MAX_URLS_PER_REQUEST) {
    return Response.json(
      {
        error: `A maximum of ${MAX_URLS_PER_REQUEST} URLs can be checked at once`,
      },
      { status: 400 }
    );
  }

  return Response.json({ statuses: await checkUrls(uniqueUrls) });
}
