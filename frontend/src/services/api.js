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
export async function downloadFile(path, filename) {
  const response = await fetch(`${apiBase}/${path}`);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "No se pudo generar el reporte. Inténtalo nuevamente.",
    );
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const money = (value) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    value,
  );
export const amount = (value) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 4 }).format(value);

export const matchesText = (value, query) => {
  const normalize = (text) =>
    String(text ?? "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .trim();
  return normalize(value).includes(normalize(query));
};
