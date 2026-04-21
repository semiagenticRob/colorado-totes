import { describe, it, expect } from "vitest";
import { canTransition, nextState } from "@/lib/domain/move-in-state";

describe("move-in state machine", () => {
  it("pending_delivery → delivered is allowed", () => {
    expect(canTransition("pending_delivery", "delivered")).toBe(true);
  });
  it("delivered → returned is allowed", () => {
    expect(canTransition("delivered", "returned")).toBe(true);
  });
  it("pending_delivery → cancelled is allowed", () => {
    expect(canTransition("pending_delivery", "cancelled")).toBe(true);
  });
  it("returned → anything is disallowed", () => {
    expect(canTransition("returned", "delivered")).toBe(false);
    expect(canTransition("returned", "pending_delivery")).toBe(false);
  });
  it("nextState throws on illegal transition", () => {
    expect(() => nextState("returned", "delivered")).toThrow();
  });
  it("nextState returns target on legal transition", () => {
    expect(nextState("delivered", "returned")).toBe("returned");
  });
});
