export const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
export async function api(path, { body, signal, method } = {}) {
  const response = await fetch(`${apiBase}/${path}`, {
    signal,
    ...(method ? { method } : {}),
    ...(body
      ? {
          method: method || "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "No se pudo completar la operación. Revisa los datos e inténtalo de nuevo.",
    );
  return data;
}
export const money = (value) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    value,
  );
export const amount = (value) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 4 }).format(value);
