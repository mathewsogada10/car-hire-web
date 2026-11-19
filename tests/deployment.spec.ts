import { test, expect } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

test.skip(
  process.env.PLAYWRIGHT_DOCKER !== "true",
  "Requires the disposable portable Docker deployment",
);

test("container proxy serves SPA routes and cached assets without exposing private API", async ({
  request,
}) => {
  const health = await request.get("/healthz");
  expect(health.status()).toBe(200);
  expect((await health.text()).trim()).toBe("ok");
  const backend = await request.get("/actuator/health");
  expect(await backend.json()).toEqual({ status: "UP" });
  const spa = await request.get("/a/client-side/route");
  expect(spa.status()).toBe(200);
  expect(spa.headers()["cache-control"]).toContain("no-cache");
  const html = await spa.text();
  expect(html).toContain('<div id="root">');
  const asset = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
  if (!asset) throw new Error("Compiled JavaScript asset missing from SPA");
  const javascript = await request.get(asset);
  expect(javascript.status()).toBe(200);
  expect(javascript.headers()["cache-control"]).toContain("immutable");
  const privateApi = await request.get("/api/v1/records/vehicles");
  expect(privateApi.status()).toBe(401);
  expect(await privateApi.text()).toBe("");
});

test("container API stores a private attachment and rejects oversized requests", async ({
  request,
}, testInfo) => {
  const initial = await request.get("/api/v1/auth/csrf");
  const initialCsrf: { token: string; headerName: string } =
    await initial.json();
  const login = await request.post("/api/v1/auth/login", {
    form: { username: "owner", password: "carhire-browser-test-only" },
    headers: { [initialCsrf.headerName]: initialCsrf.token },
  });
  expect(login.ok()).toBe(true);
  const refreshed = await request.get("/api/v1/auth/csrf");
  const csrf: { token: string; headerName: string } = await refreshed.json();
  const headers = { [csrf.headerName]: csrf.token };
  const id = randomUUID();
  const registration = "DOCKER" + Date.now();
  const created = await request.post("/api/v1/changes", {
    headers,
    data: {
      operationId: randomUUID(),
      id,
      kind: "vehicles",
      baseRevision: 0,
      data: {
        registration,
        make: "Toyota",
        model: "Axio",
        status: "Available",
      },
      deleted: false,
    },
  });
  expect(created.ok()).toBe(true);
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  const uploaded = await request.post("/api/v1/attachments?parentId=" + id, {
    headers,
    multipart: {
      file: {
        name: "container-test.png",
        mimeType: "image/png",
        buffer: image,
      },
    },
  });
  expect(uploaded.ok()).toBe(true);
  const attachment: { id: string } = await uploaded.json();
  const downloaded = await request.get("/api/v1/attachments/" + attachment.id);
  expect(downloaded.ok()).toBe(true);
  expect(await downloaded.body()).toEqual(image);
  const tooLarge = await request.post("/api/v1/attachments?parentId=" + id, {
    headers: { ...headers, "Content-Type": "application/octet-stream" },
    data: Buffer.alloc(22 * 1024 * 1024 + 1),
  });
  expect(tooLarge.status()).toBe(413);
  expect(await tooLarge.text()).toContain("nginx");
  await writeFile(
    testInfo.outputPath("persistence.json"),
    JSON.stringify({
      recordId: id,
      registration,
      attachmentId: attachment.id,
      attachmentSha256: createHash("sha256").update(image).digest("hex"),
    }),
  );
});
