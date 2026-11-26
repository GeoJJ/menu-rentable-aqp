import React, { useEffect, useState } from "react";
import { api } from "../../services/api.js";
export function MenuOffers({ menu = null, onCreated = () => {}, onCancel }) {
  const [recipes, setRecipes] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api("recipes", { signal: controller.signal })
      .then(setRecipes)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const saved = await api(menu ? `menus/${menu.id}` : "menus", {
        method: menu ? "PUT" : "POST",
        body: {
          nombre: form.get("nombre"),
          precio_menu: form.get("precio"),
          recetas: ["caldo", "segundo", "refresco"].map((c) =>
            Number(form.get(c)),
          ),
        },
      });
      onCreated(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="offer-editor" aria-labelledby="new-menu-title">
      <h3 id="new-menu-title">
        {menu ? "Editar menú" : "Arma una combinación nueva"}
      </h3>
      <p>El precio incluye el caldo, el segundo y el refresco.</p>
      {menu && (
        <p>
          Los cambios se aplican a las próximas planificaciones. Los planes ya
          guardados conservan su menú y precio originales.
        </p>
      )}
      {error && (
        <p className="flow-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Cargando recetas…</p>
      ) : (
        <form onSubmit={save}>
          <fieldset disabled={busy || !recipes.length}>
            <div className="form-grid">
              <label>
                Nombre
                <input
                  name="nombre"
                  defaultValue={menu?.nombre ?? ""}
                  placeholder="Ej. Menú de la casa"
                  maxLength={150}
                  required
                />
              </label>
              <label>
                Precio del menú completo (S/)
                <input
                  name="precio"
                  defaultValue={menu?.precio_menu ?? ""}
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ej. 13.00"
                  required
                />
              </label>
              {["caldo", "segundo", "refresco"].map((c) => (
                <label key={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                  <select
                    name={c}
                    defaultValue={
                      menu?.componentes.find((r) => r.categoria === c)?.id ?? ""
                    }
                    required
                  >
                    <option value="" disabled>
                      Seleccionar {c}
                    </option>
                    {recipes
                      .filter((r) => r.categoria === c)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="flow-actions">
              {onCancel && (
                <button type="button" className="secondary" onClick={onCancel}>
                  Cancelar
                </button>
              )}
              <button className="primary">
                {busy
                  ? "Guardando…"
                  : menu
                    ? "Guardar cambios del menú"
                    : "Guardar y usar este menú"}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
