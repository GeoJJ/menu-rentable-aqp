import React, { useEffect, useState } from "react";
import { apiBase } from "../usePlanning.js";
export function MenuOffers() {
  const [recipes, setRecipes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  async function read(path) {
    const response = await fetch(`${apiBase}/${path}`);
    if (!response.ok) throw new Error("No se pudo consultar PostgreSQL.");
    return response.json();
  }
  async function reload() {
    setLoading(true);
    setMessage("");
    try {
      const [r, m] = await Promise.all([read("recipes"), read("menus")]);
      setRecipes(r);
      setMenus(m);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: values.get("nombre"),
          precio_menu: values.get("precio"),
          recetas: ["caldo", "segundo", "refresco"].map((c) =>
            Number(values.get(c)),
          ),
        }),
      });
      if (!response.ok)
        throw new Error(
          "No se pudo guardar. Revisa el precio y los tres componentes.",
        );
      await reload();
      form.reset();
      setMessage("Menú guardado en PostgreSQL con un precio único.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <section className="panel">
        <h2>Precio del menú completo</h2>
        <p>
          Configura una combinación de caldo, segundo y refresco. El precio
          corresponde a un menú completo.
        </p>
        {message && <p role="status">{message}</p>}
        {loading ? (
          <p>Cargando desde PostgreSQL…</p>
        ) : (
          <form className="form-grid" onSubmit={save}>
            <label>
              Nombre del menú
              <input name="nombre" required maxLength={150} />
            </label>
            <label>
              Precio único (S/)
              <input
                name="precio"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </label>
            {["caldo", "segundo", "refresco"].map((category) => (
              <label key={category}>
                {category[0].toUpperCase() + category.slice(1)}
                <select name={category} required defaultValue="">
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  {recipes
                    .filter((r) => r.categoria === category)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                </select>
              </label>
            ))}
            <div className="form-submit">
              <button className="primary" disabled={saving || !recipes.length}>
                {saving ? "Guardando…" : "Guardar menú completo"}
              </button>
            </div>
          </form>
        )}
        <button
          className="secondary"
          onClick={reload}
          disabled={loading || saving}
        >
          Actualizar desde la base de datos
        </button>
      </section>
      <section className="panel">
        <h2>Menús guardados</h2>
        {!menus.length && <p>Aún no hay menús registrados.</p>}
        {menus.map((menu) => (
          <article key={menu.id}>
            <h3>
              {menu.nombre} ·{" "}
              {new Intl.NumberFormat("es-PE", {
                style: "currency",
                currency: "PEN",
              }).format(menu.precio_menu)}
            </h3>
            <ul>
              {menu.componentes.map((c) => (
                <li key={c.id}>
                  {c.categoria}: {c.nombre}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </>
  );
}
