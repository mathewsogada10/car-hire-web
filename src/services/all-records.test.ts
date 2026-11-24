import { beforeEach, expect, it, vi } from "vitest";
import { list } from "./api";
import type { Row } from "./api";
import { allRecords } from "./all-records";

vi.mock("./api", () => ({ list: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

it("keeps loading until vehicles beyond the first page are available for registration search", async () => {
  const first: Row = {
    id: "first",
    kind: "vehicles",
    revision: 1,
    data: { registration: "KDA 123A" },
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
  };
  const second: Row = {
    ...first,
    id: "second",
    data: { registration: "KDA 456B" },
  };
  vi.mocked(list)
    .mockResolvedValueOnce({
      items: [first],
      references: [],
      amountTotalMinor: 0,
      page: 0,
      size: 1,
      total: 2,
    })
    .mockResolvedValueOnce({
      items: [second],
      references: [],
      amountTotalMinor: 0,
      page: 1,
      size: 1,
      total: 2,
    });
  expect(await allRecords("vehicles")).toEqual([first, second]);
  expect(
    vi.mocked(list).mock.calls.map((call) => call[1]?.get("page")),
  ).toEqual(["0", "1"]);
});

it("reports an incomplete vehicle list instead of retrying an empty page indefinitely", async () => {
  vi.mocked(list).mockResolvedValue({
    items: [],
    references: [],
    amountTotalMinor: 0,
    page: 0,
    size: 200,
    total: 1,
  });
  await expect(allRecords("vehicles")).rejects.toThrow(
    "Unable to load all vehicles records",
  );
});
