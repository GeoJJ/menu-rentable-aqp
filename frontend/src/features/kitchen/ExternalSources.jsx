import React, { useEffect, useState } from "react";
import { api, money, amount } from "../../services/api.js";
const dateOnly = (value) =>
  value
    ? new Intl.DateTimeFormat("es-PE", { timeZone: "UTC" }).format(
        new Date(value + "T12:00:00Z"),
      )
    : "No informada";
function SourceCard({ initial }) {
  const [source, setSource] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function refresh(force = false, signal) {
    setBusy(true);
    setError("");
    try {
      setSource(
        await api(`sources/${initial.conector}/refresh?force=${force}`, {
          method: "POST",
          signal,
        }),
      );
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    refresh(false, controller.signal);
    return () => controller.abort();
  }, [initial.conector]);
  return (
    <section className="panel flow-panel">
      <div className="kitchen-heading">
        <div>
          <span className="flow-eyebrow">
            {source.tipo === "estado"
              ? "Estado"
              : source.tipo === "privada"
                ? "Empresa privada"
                : "ONG"}
          </span>
          <h3>{source.nombre}</h3>
        </div>
        <button
          className="primary"
          disabled={busy}
          onClick={() => refresh(true)}
        >
          {busy ? "Consultando…" : "Consultar ahora"}
        </button>
      </div>
      {error && (
        <p role="alert" className="flow-error">
          {error}
        </p>
      )}
      {source.ultimo_intento?.estado === "error" && (
        <p role="alert" className="flow-error">
          {source.ultimo_intento.mensaje_error} Se conserva la última lectura
          válida, si existe.
        </p>
      )}
      {source.en_cache && (
        <p>
          Se reutilizó una lectura reciente; su fecha de recuperación no cambió.
        </p>
      )}
      {!source.ultimo_dato && (
        <p>Todavía no hay datos recuperados para esta fuente.</p>
      )}
      {(source.registros ?? [source.ultimo_dato].filter(Boolean)).map(
        (record) => {
          const data = record.contenido;
          return (
            <article key={record.id}>
              <h4>{record.titulo}</h4>
              {data.precio && (
                <p>
                  Precio:{" "}
                  <strong>
                    {money(data.precio)} / {data.unidad}
                  </strong>
                  {data.precio_por_kg && (
                    <>
                      {" "}
                      · {money(data.precio_por_kg)} por kg · envase de{" "}
                      {data.contenido_kg} kg
                    </>
                  )}
                </p>
              )}
              {data.toneladas_rescatadas && (
                <p>
                  Periodo {data.periodo}: {amount(data.toneladas_rescatadas)}{" "}
                  toneladas rescatadas · aproximadamente{" "}
                  {amount(data.personas_beneficiadas_aprox)} personas
                  beneficiadas.
                </p>
              )}
              <p>Ubicación: {data.ubicacion}</p>
              {data.fecha_precio && (
                <p>Fecha del precio: {dateOnly(data.fecha_precio)}</p>
              )}
              <p>
                Publicación: {dateOnly(record.publicado_en)} · Recuperado:{" "}
                {source.ultimo_dato?.recuperado_en
                  ? new Intl.DateTimeFormat("es-PE", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Lima",
                    }).format(new Date(source.ultimo_dato.recuperado_en))
                  : "Sin consulta"}
              </p>
              {data.advertencia && <p className="notice">{data.advertencia}</p>}
              <a href={record.url_origen} target="_blank" rel="noreferrer">
                Comprobar publicación de origen ↗
              </a>
            </article>
          );
        },
      )}
    </section>
  );
}
export function ExternalSources() {
  const [sources, setSources] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    api("sources", { signal: c.signal })
      .then(setSources)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, []);
  return (
    <div>
      <h2>Referencias externas</h2>
      <p>
        Compara las referencias de precios con lo que cobra tu proveedor y
        consulta información sobre rescate de alimentos. Revisa siempre la fecha
        y la ubicación. Estas referencias no registran compras ni cambian las
        existencias de tu cocina.
      </p>
      {error && (
        <p role="alert" className="flow-error">
          {error}
        </p>
      )}
      {sources.map((s) => (
        <SourceCard key={s.id} initial={s} />
      ))}
    </div>
  );
}
