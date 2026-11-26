import React, { useEffect, useState } from "react";
import { api, money, amount } from "../../services/api.js";
import { ExternalSources } from "./ExternalSources.jsx";
const blankRecipe = () => ({
  nombre: "",
  categoria: "segundo",
  rendimiento: 10,
  preparacion: "",
  ingredientes: [],
});
export function Kitchen({ onChanged, onPurchases = () => {} }) {
  const [tab, setTab] = useState("recipes"),
    [recipes, setRecipes] = useState([]),
    [ingredients, setIngredients] = useState([]),
    [query, setQuery] = useState(""),
    [editor, setEditor] = useState(null),
    [stock, setStock] = useState(null),
    [newIngredient, setNewIngredient] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  async function reload() {
    const [r, i] = await Promise.all([api("recipes"), api("ingredients")]);
    setRecipes(r);
    setIngredients(i);
  }
  useEffect(() => {
    reload()
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function edit(id) {
    setBusy(true);
    setMessage("");
    try {
      setEditor(await api(`recipes/${id}`));
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  function field(key, value) {
    setEditor((e) => ({ ...e, [key]: value }));
  }
  function item(index, key, value) {
    setEditor((e) => ({
      ...e,
      ingredientes: e.ingredientes.map((i, n) =>
        n === index ? { ...i, [key]: value } : i,
      ),
    }));
  }
  async function saveRecipe(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api(editor.id ? `recipes/${editor.id}` : "recipes", {
        method: editor.id ? "PUT" : "POST",
        body: editor,
      });
      await reload();
      setEditor(null);
      onChanged();
      setMessage("Receta guardada. Ya está disponible al armar tus menús.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function archive(id) {
    if (
      !window.confirm(
        "¿Archivar esta receta? Permanecerá en los planes históricos.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await api(`recipes/${id}`, { method: "DELETE" });
      await reload();
      onChanged();
      setMessage("Receta archivada.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveIngredient(event) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      await api("ingredients", {
        body: { nombre: f.get("nombre"), unidad_codigo: f.get("unidad") },
      });
      await reload();
      setNewIngredient(false);
      onChanged();
      setMessage("Ingrediente agregado. Puedes usarlo en tus recetas.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveStock(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { id, nombre, unidad_codigo, ...body } = stock;
    try {
      await api(`ingredients/${id}/stock`, { method: "PUT", body });
      await reload();
      setStock(null);
      onChanged();
      setMessage(
        "Despensa y precio guardados. Se usarán en tu próxima planificación.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  const matches = (name) =>
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .includes(query.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase());
  return (
    <section className="panel flow-panel">
      <div
        className="kitchen-tabs"
        role="group"
        aria-label="Secciones de mi cocina"
      >
        <button
          className={tab === "recipes" ? "primary" : "secondary"}
          disabled={busy}
          onClick={() => {
            setTab("recipes");
            setEditor(null);
            setStock(null);
            setMessage("");
          }}
        >
          Recetas
        </button>
        <button
          className={tab === "pantry" ? "primary" : "secondary"}
          disabled={busy}
          onClick={() => {
            setTab("pantry");
            setEditor(null);
            setMessage("");
          }}
        >
          Despensa y precios
        </button>
        <button
          className={tab === "sources" ? "primary" : "secondary"}
          disabled={busy}
          onClick={() => {
            setTab("sources");
            setEditor(null);
            setStock(null);
            setMessage("");
          }}
        >
          Referencias externas
        </button>
      </div>
      {tab === "sources" && <ExternalSources />}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {loading && <p>Cargando tu cocina…</p>}
      {tab === "recipes" && !editor && (
        <>
          <div className="kitchen-heading">
            <div>
              <h2>Tu recetario</h2>
              <p>
                Define los ingredientes para una cantidad de porciones. El
                precio de venta pertenece al menú completo.
              </p>
            </div>
            <button
              className="primary"
              disabled={busy}
              onClick={() => {
                setEditor(blankRecipe());
                setMessage("");
              }}
            >
              + Nueva receta
            </button>
          </div>
          <label>
            Buscar receta
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre del plato o refresco"
            />
          </label>
          <div className="saved-plans">
            {recipes
              .filter((r) => matches(r.nombre))
              .map((r) => (
                <article key={r.id}>
                  <div>
                    <h3>{r.nombre}</h3>
                    <p>
                      {r.categoria} · rinde {r.rendimiento} porciones
                    </p>
                  </div>
                  <div>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => edit(r.id)}
                    >
                      Editar {r.nombre}
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => archive(r.id)}
                    >
                      Archivar
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </>
      )}
      {tab === "recipes" && editor && (
        <form onSubmit={saveRecipe}>
          <fieldset disabled={busy}>
            <h2>{editor.id ? "Editar receta" : "Nueva receta"}</h2>
            <div className="example-note">
              <strong>Escribe tu receta para una tanda completa.</strong>
              <p>
                Si una olla alcanza para 10 porciones y usas 1 kg de arroz,
                indica que rinde 10 porciones y agrega arroz con cantidad 1 kg.
                No escribas la cantidad para un solo plato: el sistema ajustará
                la receta al plan que prepares.
              </p>
            </div>
            <div className="form-grid">
              <label>
                Nombre
                <input
                  required
                  maxLength={150}
                  value={editor.nombre}
                  onChange={(e) => field("nombre", e.target.value)}
                />
              </label>
              <label>
                Tipo
                <select
                  value={editor.categoria}
                  onChange={(e) => field("categoria", e.target.value)}
                >
                  {["caldo", "segundo", "refresco", "entrada"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                ¿Cuántas porciones rinde?
                <input
                  required
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  value={editor.rendimiento}
                  onChange={(e) => field("rendimiento", Number(e.target.value))}
                />
              </label>
            </div>
            <h3>Ingredientes para esas {editor.rendimiento} porciones</h3>
            <p>
              Usa kilos, litros o unidades según indique el ingrediente. 500
              gramos son 0.5 kg; 250 ml son 0.25 L.
            </p>
            {editor.ingredientes.map((i, index) => (
              <div className="recipe-item-row" key={index}>
                <label>
                  Ingrediente
                  <select
                    required
                    value={i.ingrediente_id}
                    onChange={(e) =>
                      item(index, "ingrediente_id", Number(e.target.value))
                    }
                  >
                    <option value="">Seleccionar</option>
                    {ingredients.map((g) => (
                      <option
                        key={g.id}
                        value={g.id}
                        disabled={editor.ingredientes.some(
                          (other, n) =>
                            n !== index && other.ingrediente_id === g.id,
                        )}
                      >
                        {g.nombre} ({g.unidad_codigo})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Cantidad en{" "}
                  {ingredients.find((g) => g.id === Number(i.ingrediente_id))
                    ?.unidad_codigo ?? "unidad base"}
                  <input
                    required
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={i.cantidad}
                    onChange={(e) => item(index, "cantidad", e.target.value)}
                  />
                </label>
                <button
                  className="secondary"
                  type="button"
                  aria-label={`Quitar ingrediente ${index + 1}`}
                  onClick={() =>
                    field(
                      "ingredientes",
                      editor.ingredientes.filter((_, n) => n !== index),
                    )
                  }
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              type="button"
              className="secondary"
              onClick={() =>
                field("ingredientes", [
                  ...editor.ingredientes,
                  { ingrediente_id: "", cantidad: "" },
                ])
              }
            >
              + Agregar ingrediente
            </button>
            <p>
              ¿Falta un ingrediente? Créalo en Despensa y precios antes de
              completar esta receta.
            </p>
            <label>
              Preparación
              <textarea
                rows="5"
                value={editor.preparacion ?? ""}
                onChange={(e) => field("preparacion", e.target.value)}
              />
            </label>
            <div className="flow-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditor(null)}
              >
                Cancelar
              </button>
              <button
                className="primary"
                disabled={!editor.ingredientes.length}
              >
                {busy ? "Guardando…" : "Guardar receta"}
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {tab === "pantry" && (
        <>
          <div className="kitchen-heading">
            <div>
              <h2>Despensa y precios</h2>
              <p>
                Cuenta los ingredientes que ya tienes al empezar a usar la
                aplicación, o corrige un conteo equivocado. Aquí reemplazas la
                cantidad registrada por el total que hay ahora en tu cocina.
              </p>
            </div>
            <button
              className="primary"
              onClick={() => setNewIngredient(!newIngredient)}
            >
              + Nuevo ingrediente
            </button>
          </div>
          <div className="example-note">
            <strong>¿Acabas de comprar?</strong>
            <p>
              Registra esa compra en Compras y resultados: allí se suma lo que
              recibiste. Si actualizas el total aquí y registras también la
              misma compra, contarás dos veces los ingredientes.
            </p>
            <button type="button" className="text-action" onClick={onPurchases}>
              Registrar una compra recibida →
            </button>
          </div>
          {newIngredient && (
            <form className="offer-editor" onSubmit={saveIngredient}>
              <fieldset disabled={busy}>
                <div className="form-grid">
                  <label>
                    Nombre
                    <input name="nombre" required maxLength={150} />
                  </label>
                  <label>
                    Lo mediré en
                    <select name="unidad">
                      <option value="kg">Kilos (kg)</option>
                      <option value="L">Litros (L)</option>
                      <option value="unidad">Unidades</option>
                    </select>
                    <small className="field-help">
                      Elige cómo usarás este ingrediente en tus recetas: kg para
                      arroz o carne, L para líquidos y unidades para piezas.
                    </small>
                  </label>
                </div>
                <div className="flow-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setNewIngredient(false)}
                  >
                    Cancelar
                  </button>
                  <button className="primary">Agregar ingrediente</button>
                </div>
              </fieldset>
            </form>
          )}
          {stock && (
            <form className="offer-editor" onSubmit={saveStock}>
              <fieldset disabled={busy}>
                <h3>Actualizar {stock.nombre}</h3>
                <p>
                  Esto es un conteo: escribe el total que tienes ahora, no la
                  cantidad de una compra nueva. Al guardar se reemplazará la
                  existencia anterior.
                </p>
                <div className="form-grid">
                  {[
                    [
                      "existencia",
                      "Cantidad total que hay en mi cocina",
                      stock.unidad_codigo,
                    ],
                    [
                      "costo_unitario",
                      "Costo por unidad de lo que ya tengo",
                      "S/ por " + stock.unidad_codigo,
                    ],
                    [
                      "precio_compra",
                      "Precio actual de mi proveedor",
                      "S/ por " + stock.unidad_codigo,
                    ],
                  ].map(([key, label, unit]) => (
                    <label key={key}>
                      {label} ({unit})
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.0001"
                        disabled={
                          key === "costo_unitario" &&
                          stock.existencia !== "" &&
                          Number(stock.existencia) === 0
                        }
                        value={stock[key]}
                        onChange={(e) =>
                          setStock((s) => ({
                            ...s,
                            [key]: e.target.value,
                            ...(key === "existencia" &&
                            e.target.value !== "" &&
                            Number(e.target.value) === 0
                              ? { costo_unitario: "0" }
                              : {}),
                          }))
                        }
                      />
                      <small className="field-help">
                        {key === "existencia"
                          ? "Cuenta todo lo disponible. Si no tienes, escribe 0."
                          : key === "costo_unitario"
                            ? "Lo que te costó un kg, L o unidad de tus existencias. Si una bolsa de 5 kg te costó S/20, el costo es S/4 por kg."
                            : "Lo que pagarías hoy por un kg, L o unidad. Se usa para estimar próximas compras; no registra una compra."}
                      </small>
                    </label>
                  ))}
                  <label>
                    Proveedor o mercado
                    <input
                      required
                      value={stock.proveedor}
                      placeholder="Ej. Mercado San Camilo, puesto 12"
                      onChange={(e) =>
                        setStock((s) => ({ ...s, proveedor: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Ciudad o ubicación
                    <input
                      required
                      value={stock.ubicacion}
                      placeholder="Ej. Arequipa"
                      onChange={(e) =>
                        setStock((s) => ({ ...s, ubicacion: e.target.value }))
                      }
                    />
                  </label>
                </div>
                <p>
                  Ejemplo: si tienes 2 kg de arroz y pagaste S/4 por kilo,
                  escribe 2 y 4. En «Precio actual de mi proveedor» indica el
                  precio actual por kilo.
                </p>
                <div className="flow-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setStock(null)}
                  >
                    Cancelar
                  </button>
                  <button className="primary">Guardar conteo y precios</button>
                </div>
              </fieldset>
            </form>
          )}
          <label>
            Buscar ingrediente
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre del ingrediente"
            />
          </label>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Cantidad en cocina</th>
                  <th>Costo de mis existencias</th>
                  <th>Precio para comprar</th>
                  <th>Actualizar</th>
                </tr>
              </thead>
              <tbody>
                {ingredients
                  .filter((i) => matches(i.nombre))
                  .map((i) => (
                    <tr key={i.id}>
                      <th>
                        {i.nombre}
                        <small className="unit-note">{i.unidad_codigo}</small>
                      </th>
                      <td>
                        {i.existencia === null
                          ? "Sin registrar"
                          : amount(i.existencia)}
                      </td>
                      <td>
                        {i.costo_unitario === null
                          ? "Sin registrar"
                          : money(i.costo_unitario)}
                      </td>
                      <td>
                        {i.precio_compra === null
                          ? "Sin registrar"
                          : money(i.precio_compra)}
                        {i.fecha_precio && (
                          <small className="unit-note">{i.fecha_precio}</small>
                        )}
                      </td>
                      <td>
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => {
                            setStock({
                              id: i.id,
                              nombre: i.nombre,
                              unidad_codigo: i.unidad_codigo,
                              existencia: i.existencia ?? "",
                              costo_unitario:
                                Number(i.existencia) === 0
                                  ? "0"
                                  : (i.costo_unitario ?? ""),
                              precio_compra: i.precio_compra ?? "",
                              proveedor: i.proveedor ?? "",
                              ubicacion: i.ubicacion ?? "Arequipa",
                            });
                            setMessage("");
                            window.scrollTo(0, 0);
                          }}
                        >
                          Actualizar {i.nombre}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
