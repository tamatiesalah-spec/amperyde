import { describe, expect, it } from "vitest";
import { LocalOrderRepository } from "@/server/orders/localRepository";
import type { NewOrder } from "@/domain/order";

const sample: NewOrder = {
  lineSlug: "off-road",
  componentIds: ["chassis-hardtail", "motor-hub-750"],
  extraIds: ["extra-lights"],
  totalCents: 209000,
  currency: "EUR",
  pickup: "Rotterdam Centraal",
  customerEmail: "rider@example.com",
};

describe("LocalOrderRepository", () => {
  it("creates an order with an id, AMP reference, and 'received' status", async () => {
    const repo = new LocalOrderRepository();
    const order = await repo.create(sample);
    expect(order.id).toBeTruthy();
    expect(order.reference).toMatch(/^AMP-[A-Z0-9]{4}$/);
    expect(order.status).toBe("received");
    expect(order.createdAt).toBeTruthy();
    expect(order).toMatchObject({ totalCents: 209000, pickup: "Rotterdam Centraal", customerEmail: "rider@example.com" });
  });

  it("lists orders newest-first (seeded + created)", async () => {
    const repo = new LocalOrderRepository();
    const before = await repo.list();
    const created = await repo.create(sample);
    const after = await repo.list();
    expect(after.length).toBe(before.length + 1);
    expect(after[0].id).toBe(created.id); // newest first
    const dates = after.map((o) => o.createdAt);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it("gets an order by id, or null", async () => {
    const repo = new LocalOrderRepository();
    const created = await repo.create(sample);
    expect((await repo.get(created.id))?.id).toBe(created.id);
    expect(await repo.get("nope")).toBeNull();
  });

  it("updates status, or returns null for an unknown id", async () => {
    const repo = new LocalOrderRepository();
    const created = await repo.create(sample);
    const updated = await repo.updateStatus(created.id, "in_production");
    expect(updated?.status).toBe("in_production");
    expect(await repo.updateStatus("nope", "collected")).toBeNull();
  });
});
