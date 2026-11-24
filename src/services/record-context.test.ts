import { beforeEach, expect, it, vi } from "vitest";
import { record } from "./api";
import type { Row } from "./api";
import { recordContext } from "./record-context";

vi.mock("./api", () => ({ record: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

it("deduplicates references and reuses a known vehicle when resolving hire labels", async () => {
  const vehicle: Row = {
    id: "vehicle",
    kind: "vehicles",
    revision: 1,
    data: { registration: "KDA 123A" },
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
  };
  const hire: Row = {
    ...vehicle,
    id: "hire",
    kind: "hires",
    data: { vehicleId: vehicle.id },
  };
  vi.mocked(record).mockResolvedValue(hire);
  const result = await recordContext(
    [
      { kind: "hires", id: hire.id },
      { kind: "hires", id: hire.id },
      { kind: "vehicles", id: vehicle.id },
    ],
    [vehicle],
  );
  expect(record).toHaveBeenCalledExactlyOnceWith("hires", hire.id);
  expect(result).toEqual([vehicle, hire]);
});

it("propagates failed lookups instead of treating IDs as resolved names", async () => {
  vi.mocked(record).mockRejectedValue(new Error("Category lookup unavailable"));
  await expect(
    recordContext([{ kind: "categories", id: "category" }]),
  ).rejects.toThrow("Category lookup unavailable");
});
