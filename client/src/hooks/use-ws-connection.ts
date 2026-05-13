import { useEffect, useState } from "react";
import { dashboardSocket } from "@/api";

type WsStatus = "connecting" | "open" | "closed" | "reconnecting";

export function useWsConnection(): WsStatus {
  const [status, setStatus] = useState<WsStatus>(
    dashboardSocket.isConnected ? "open" : "closed",
  );

  useEffect(() => {
    const off1 = dashboardSocket.on("connect", () => setStatus("open"));
    const off2 = dashboardSocket.on("reconnect", () =>
      setStatus("reconnecting"),
    );
    const off3 = dashboardSocket.on("disconnect", () => setStatus("closed"));
    return () => {
      off1();
      off2();
      off3();
    };
  }, []);

  return status;
}
