"use client";

import { useEffect } from "react";

export default function ApiErrorGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (!reason) return;
      const name = reason?.name || "";
      const msg = String(reason?.message || reason || "");
      const isApiError =
        name === "ApiError" ||
        msg === "Not Found" ||
        msg.startsWith("API error:") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("Необходима авторизация");
      if (isApiError) {
        event.preventDefault();
        if (process.env.NODE_ENV !== "production") {

          console.warn("[api offline]", msg);
        }
      }
    };

    const onError = (event: ErrorEvent) => {
      const msg = String(event.message || "");
      if (
        msg === "Not Found" ||
        msg.startsWith("API error:") ||
        msg.includes("Failed to fetch")
      ) {
        event.preventDefault();
        if (process.env.NODE_ENV !== "production") {
          console.warn("[api offline]", msg);
        }
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
