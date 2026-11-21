import React, { useEffect, useState } from "react";
import { api, money } from "../services/api.js";
const dateOnly = (value) =>
  value
    ? new Intl.DateTimeFormat("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value + "T12:00:00Z"))
    : "No informada";
const instant = (value) =>
  value
    ? new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Lima",
      }).format(new Date(value))
    : "Sin consulta";
export function ExternalSources() {
  const [source, setSource] = useState(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  async function refresh(force = false, signal) {
    setBusy(true);
    setError("");
    try {
      const result = await api(
        `sources/midagri/refresh${force ? "?force=true" : ""}`,
        { method: "POST", signal },
      );
      setSource(result);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    api("sources/midagri", { signal: controller.signal })
      .then((initial) => {
        setSource(initial);
        return refresh(false, controller.signal);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setBusy(false);
        }
      });
    return () => controller.abort();
  }, []);
  const record = source?.ultimo_dato;
  const price = record?.contenido;
  const failed = source?.ultimo_intento?.estado === "error";
  const old =
    price &&
    Date.now() - new Date(price.fecha_precio + "T12:00:00Z").getTime() >
      7 * 86400000;
  return (
    <div className="external-source">
      <div className="kitchen-heading">
        <div>
          <h2>Referencia oficial de precios</h2>
          <p>
            Consulta la información publicada por MIDAGRI para Arequipa y
            compárala con lo que cobra tu proveedor.
          </p>
        </div>
        <button
          className="primary"
          disabled={busy}
          onClick={() => refresh(true)}
        >
          {busy ? "Consultando fuente…" : "Consultar MIDAGRI ahora"}
        </button>
      </div>
      {error && (
        <p className="flow-error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p role="status">
          Buscando y leyendo el último boletín disponible de la fuente oficial…
        </p>
      )}
      {failed && (
        <p className="flow-error" role="alert">
          {source.ultimo_intento.mensaje_error}{" "}
          {record
            ? "Se muestra la última referencia recuperada correctamente."
            : "Todavía no hay una referencia válida guardada."}
        </p>
      )}
      {source?.en_cache && !failed && (
        <p role="status">
          La referencia ya fue consultada recientemente. Se conserva la fecha
          real de recuperación que aparece abajo.
        </p>
      )}
      {source?.en_progreso && (
        <p role="status">
          Hay otra consulta en curso. Vuelve a consultar cuando termine.
        </p>
      )}
      {price && (
        <article className="source-reference">
          <span className="flow-eyebrow">MIDAGRI · FUENTE ESTATAL</span>
          <div className="plan-heading">
            <div>
              <h3>{price.producto}</h3>
              <p>{price.ubicacion}</p>
            </div>
            <strong>
              {money(price.precio)}
              <small>por {price.unidad} · precio mayorista referencial</small>
            </strong>
          </div>
          <dl className="source-dates">
            <div>
              <dt>Fecha del precio</dt>
              <dd>{dateOnly(price.fecha_precio)}</dd>
            </div>
            <div>
              <dt>Fecha del boletín</dt>
              <dd>{dateOnly(record.publicado_en)}</dd>
            </div>
            <div>
              <dt>Recuperado de la fuente</dt>
              <dd>{instant(record.recuperado_en)}</dd>
            </div>
          </dl>
          {old && (
            <p className="flow-error">
              Referencia de más de siete días. Comprueba el precio actual con tu
              proveedor.
            </p>
          )}
          <p className="source-caution">
            {price.advertencia} Esta consulta no cambia tus precios de compra.
          </p>
          <a href={record.url_origen} target="_blank" rel="noreferrer">
            Ver el boletín oficial en PDF ↗
          </a>
        </article>
      )}
      {!record && !busy && !error && !failed && (
        <p>Aún no se ha recuperado un precio de esta fuente.</p>
      )}
      <p className="flow-footnote">
        Se consulta automáticamente al abrir esta sección. Si hay una lectura
        reciente, se reutiliza para evitar consultas repetidas. La información
        se guarda con su origen y fechas; un fallo no elimina la última lectura
        válida.
      </p>
      {source && (
        <p className="flow-footnote">
          Último intento: {instant(source.ultimo_intento?.iniciado_en)} ·{" "}
          {source.ultimo_intento?.estado === "correcto"
            ? "Completado"
            : (source.ultimo_intento?.estado ?? "Sin consulta")}
          .{" "}
          <a href={source.url_base} target="_blank" rel="noreferrer">
            Colección de MIDAGRI ↗
          </a>
        </p>
      )}
    </div>
  );
}
