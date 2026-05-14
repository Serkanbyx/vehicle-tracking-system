import { describe, it, expect, vi, beforeEach } from "vitest";
import WebSocket from "ws";
import { RoomManager } from "../room-manager.service.js";

/* ------------------------------------------------------------------ */
/*  Mock WebSocket factory                                             */
/* ------------------------------------------------------------------ */

const createMockSocket = (
  readyState: number = WebSocket.OPEN,
): WebSocket => {
  const socket = {
    readyState,
    send: vi.fn(),
  } as unknown as WebSocket;
  return socket;
};

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

let manager: RoomManager;

beforeEach(() => {
  manager = new RoomManager();
});

describe("RoomManager — join", () => {
  it("should add socket to a room", () => {
    const ws = createMockSocket();
    manager.join(ws, "room:a");

    expect(manager.count("room:a")).toBe(1);
  });

  it("should allow same socket to join multiple rooms", () => {
    const ws = createMockSocket();
    manager.join(ws, "room:a");
    manager.join(ws, "room:b");

    expect(manager.count("room:a")).toBe(1);
    expect(manager.count("room:b")).toBe(1);
  });

  it("should allow multiple sockets in the same room", () => {
    const ws1 = createMockSocket();
    const ws2 = createMockSocket();

    manager.join(ws1, "room:shared");
    manager.join(ws2, "room:shared");

    expect(manager.count("room:shared")).toBe(2);
  });

  it("should not duplicate socket in same room", () => {
    const ws = createMockSocket();
    manager.join(ws, "room:a");
    manager.join(ws, "room:a");

    expect(manager.count("room:a")).toBe(1);
  });
});

describe("RoomManager — leave", () => {
  it("should remove socket from a room", () => {
    const ws = createMockSocket();
    manager.join(ws, "room:a");
    manager.leave(ws, "room:a");

    expect(manager.count("room:a")).toBe(0);
  });

  it("should clean up empty rooms", () => {
    const ws = createMockSocket();
    manager.join(ws, "room:temp");
    manager.leave(ws, "room:temp");

    expect(manager.count("room:temp")).toBe(0);
  });

  it("should not throw when leaving a room never joined", () => {
    const ws = createMockSocket();
    expect(() => manager.leave(ws, "room:unknown")).not.toThrow();
  });

  it("should only remove from specified room", () => {
    const ws = createMockSocket();
    manager.join(ws, "room:a");
    manager.join(ws, "room:b");

    manager.leave(ws, "room:a");

    expect(manager.count("room:a")).toBe(0);
    expect(manager.count("room:b")).toBe(1);
  });
});

describe("RoomManager — leaveAll", () => {
  it("should remove socket from every room", () => {
    const ws = createMockSocket();
    manager.join(ws, "room:a");
    manager.join(ws, "room:b");
    manager.join(ws, "room:c");

    manager.leaveAll(ws);

    expect(manager.count("room:a")).toBe(0);
    expect(manager.count("room:b")).toBe(0);
    expect(manager.count("room:c")).toBe(0);
  });

  it("should not affect other sockets", () => {
    const ws1 = createMockSocket();
    const ws2 = createMockSocket();

    manager.join(ws1, "room:shared");
    manager.join(ws2, "room:shared");

    manager.leaveAll(ws1);

    expect(manager.count("room:shared")).toBe(1);
  });

  it("should not throw for socket that never joined", () => {
    const ws = createMockSocket();
    expect(() => manager.leaveAll(ws)).not.toThrow();
  });
});

describe("RoomManager — broadcast", () => {
  it("should send JSON to all OPEN sockets in the room", () => {
    const ws1 = createMockSocket();
    const ws2 = createMockSocket();

    manager.join(ws1, "room:x");
    manager.join(ws2, "room:x");

    const payload = { type: "test", value: 42 };
    manager.broadcast("room:x", payload);

    const expected = JSON.stringify(payload);
    expect((ws1.send as any)).toHaveBeenCalledWith(expected);
    expect((ws2.send as any)).toHaveBeenCalledWith(expected);
  });

  it("should skip closed sockets and remove them", () => {
    const wsOpen = createMockSocket(WebSocket.OPEN);
    const wsClosed = createMockSocket(WebSocket.CLOSED);

    manager.join(wsOpen, "room:x");
    manager.join(wsClosed, "room:x");

    manager.broadcast("room:x", { msg: "hi" });

    expect((wsOpen.send as any)).toHaveBeenCalled();
    expect((wsClosed.send as any)).not.toHaveBeenCalled();
  });

  it("should not throw for empty or non-existent room", () => {
    expect(() => manager.broadcast("room:ghost", { a: 1 })).not.toThrow();
  });
});

describe("RoomManager — broadcastToMany", () => {
  it("should send to sockets across multiple rooms", () => {
    const ws1 = createMockSocket();
    const ws2 = createMockSocket();

    manager.join(ws1, "room:a");
    manager.join(ws2, "room:b");

    manager.broadcastToMany(["room:a", "room:b"], { x: 1 });

    expect((ws1.send as any)).toHaveBeenCalled();
    expect((ws2.send as any)).toHaveBeenCalled();
  });

  it("should deduplicate — socket in multiple rooms receives message once", () => {
    const ws = createMockSocket();

    manager.join(ws, "room:a");
    manager.join(ws, "room:b");

    manager.broadcastToMany(["room:a", "room:b"], { msg: "once" });

    expect((ws.send as any)).toHaveBeenCalledTimes(1);
  });

  it("should handle mix of existing and non-existing rooms", () => {
    const ws = createMockSocket();
    manager.join(ws, "room:real");

    expect(() =>
      manager.broadcastToMany(["room:real", "room:fake"], { data: true }),
    ).not.toThrow();

    expect((ws.send as any)).toHaveBeenCalledTimes(1);
  });
});

describe("RoomManager — count", () => {
  it("should return 0 for non-existent room", () => {
    expect(manager.count("room:nope")).toBe(0);
  });

  it("should reflect current membership", () => {
    const ws1 = createMockSocket();
    const ws2 = createMockSocket();

    manager.join(ws1, "room:a");
    expect(manager.count("room:a")).toBe(1);

    manager.join(ws2, "room:a");
    expect(manager.count("room:a")).toBe(2);

    manager.leave(ws1, "room:a");
    expect(manager.count("room:a")).toBe(1);
  });
});
