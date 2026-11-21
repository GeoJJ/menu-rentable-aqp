import { useEffect, useState } from "react";
export const apiBase =
  import.meta.env.VITE_API_BASE_URL || "/api";
export function usePlanning(payload) {
  const serialized = JSON.stringify(payload);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${apiBase}/planning/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: serialized,
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error("Revisa las cantidades y la configuración del menú.");
        const data = await response.json();
        setResult({ key: serialized, data });
      } catch (err) {
        if (err.name !== "AbortError")
          setError(
            "No se pudo calcular el plan en Python. Verifica que el backend esté disponible. " +
              err.message,
          );
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [serialized]);
  return { data: result?.key === serialized ? result.data : null, error };
}
