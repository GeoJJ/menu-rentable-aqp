import React from "react";

export function GuidedField({ id, label, hint, children }) {
  return (
    <div className="guided-field">
      <label htmlFor={id}>{label}</label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": hint ? `${id}-help` : undefined,
      })}
      {hint && (
        <small id={`${id}-help`} className="field-help">
          {hint}
        </small>
      )}
    </div>
  );
}

export function WorkflowGuide({ onGo }) {
  return (
    <details className="flow-help workflow-guide">
      <summary>¿Qué lleno y en qué orden?</summary>
      <ol>
        <li>
          <strong>Prepara tu cocina.</strong> Registra recetas y cuenta los
          ingredientes que ya tienes. Esto se hace al empezar o cuando cambie tu
          cocina.{" "}
          <button
            type="button"
            className="text-action"
            onClick={() => onGo("kitchen")}
          >
            Abrir Mi cocina
          </button>
        </li>
        <li>
          <strong>Planifica antes de cocinar.</strong> Elige el menú, cuántos
          esperas vender y cuánto puedes gastar en ingredientes. Obtendrás una
          lista estimada de compras.{" "}
          <button
            type="button"
            className="text-action"
            onClick={() => onGo("plan")}
          >
            Preparar un plan
          </button>
        </li>
        <li>
          <strong>Registra lo que compraste.</strong> Después de comprar,
          ingresa el ingrediente, la cantidad recibida y el total que pagaste.
          No vuelvas a registrar una compra que ya sumaste a la despensa.{" "}
          <button
            type="button"
            className="text-action"
            onClick={() => onGo("results")}
          >
            Registrar una compra
          </button>
        </li>
        <li>
          <strong>Cierra el día cuando termines de vender.</strong> Abre tu plan
          e indica cuántos menús preparaste, cuántos vendiste y qué otros gastos
          tuviste. Al confirmar, se descuentan los ingredientes usados.{" "}
          <button
            type="button"
            className="text-action"
            onClick={() => onGo("saved")}
          >
            Abrir Mis planes
          </button>
        </li>
        <li>
          <strong>Consulta tus resultados.</strong> Elige las fechas de los días
          que ya cerraste y descarga el reporte. Planificar no registra ventas
          por sí solo.
        </li>
      </ol>
    </details>
  );
}
