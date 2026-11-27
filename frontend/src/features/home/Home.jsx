import React from "react";

const steps = [
  {
    id: "01",
    image: "planifica",
    title: "Planifica tu menú",
    text: "Elige caldo, segundo y refresco. Indica cuántos menús prepararás y cuánto puedes gastar.",
    action: "Elegir mi menú",
    page: "plan",
    alt: "Menú completo junto a una libreta para planificar",
  },
  {
    id: "02",
    image: "compra",
    title: "Compra lo que necesitas",
    text: "Revisa los ingredientes que faltan. Después de comprar, registra cuánto recibiste y el total que pagaste.",
    action: "Registrar una compra",
    page: "results",
    alt: "Canasta de ingredientes, balanza y comprobante de compra",
  },
  {
    id: "03",
    image: "prepara",
    title: "Prepara tus porciones",
    text: "Consulta las cantidades calculadas y cocina con tus recetas. Al cerrar el día indicarás cuántos menús preparaste realmente.",
    action: "Ver mis recetas",
    page: "kitchen",
    alt: "Ollas de comida y dos platos con porciones servidas",
  },
  {
    id: "04",
    image: "cierra",
    title: "Cierra y conoce el resultado",
    text: "Al terminar de vender, registra preparados, vendidos y otros gastos. Revisa los sobrantes y el margen de ese día.",
    action: "Abrir mis planes",
    page: "saved",
    alt: "Registro del día, calculadora y una porción de comida sobrante",
  },
];

export function Home({ onGo }) {
  return (
    <div className="home-page" id="inicio">
      <section className="home-hero" aria-labelledby="home-title">
        <img
          className="home-hero-image"
          src="/images/inicio-arequipa-v1.webp"
          width="1860"
          height="846"
          alt="Mesa con caldo, rocoto relleno, pastel de papa y chicha morada en una terraza inspirada en Arequipa"
          fetchPriority="high"
        />
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            PARA LOS NEGOCIOS QUE COCINAN CADA DÍA
          </span>
          <h1 id="home-title">
            Tu menú,
            <br />
            bien pensado.
          </h1>
          <p>
            Organiza tus porciones, calcula tus compras y conoce el resultado de
            cada día.
          </p>
          <div className="home-actions">
            <button className="primary" onClick={() => onGo("plan")}>
              Preparar mi plan <span aria-hidden="true">↗</span>
            </button>
            <a href="#como-funciona" className="home-how-link">
              Cómo funciona <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <span className="home-hero-place">COCINA LOCAL · AREQUIPA</span>
      </section>

      <section className="landing-benefits" aria-labelledby="benefits-title">
        <div className="landing-section-title">
          <span className="flow-eyebrow">MENOS IMPROVISACIÓN EN TU DÍA</span>
          <h2 id="benefits-title">Decide con tus propios datos.</h2>
          <p>
            Desde las porciones de tu receta hasta lo que quedó después de
            vender.
          </p>
        </div>
        <div className="landing-benefit-grid">
          <article>
            <span className="benefit-index">01 / PORCIONES</span>
            <h3>Calcula cuánto preparar.</h3>
            <p>
              El sistema adapta los ingredientes de tus recetas a la cantidad de
              menús que eliges.
            </p>
          </article>
          <article>
            <span className="benefit-index">02 / COMPRAS</span>
            <h3>Revisa lo que te falta.</h3>
            <p>
              Compara lo necesario con tus existencias y consulta una lista de
              compras antes de cocinar.
            </p>
          </article>
          <article>
            <span className="benefit-index">03 / RESULTADOS</span>
            <h3>Conoce cómo terminó el día.</h3>
            <p>
              Registra preparados, ventas y gastos. Consulta sobrantes, margen y
              reportes por fechas.
            </p>
          </article>
        </div>
      </section>

      <section
        id="como-funciona"
        className="home-section"
        aria-labelledby="home-how-title"
      >
        <div className="home-section-heading">
          <div>
            <span className="flow-eyebrow">UN RECORRIDO, CUATRO PASOS</span>
            <h2 id="home-how-title">De tu cocina a tus cuentas.</h2>
          </div>
          <p>
            Empieza por tus recetas y existencias en{" "}
            <button className="text-action" onClick={() => onGo("kitchen")}>
              Mi cocina
            </button>
            . Después, sigue este recorrido.
          </p>
        </div>
        <div className="home-steps">
          {steps.map((step) => (
            <article key={step.id} className="home-step">
              <div className="home-step-picture">
                <img
                  src={`/images/como-funciona/${step.image}-v1.webp`}
                  width="1448"
                  height="1086"
                  loading="lazy"
                  decoding="async"
                  alt={step.alt}
                />
                <span
                  className="home-step-number"
                  aria-label={`Paso ${step.id}`}
                >
                  {step.id}
                </span>
              </div>
              <div className="home-step-copy">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <button
                  className="home-step-action"
                  onClick={() => onGo(step.page)}
                >
                  {step.action}
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="consejos"
        className="home-section home-tips"
        aria-labelledby="home-tips-title"
      >
        <span className="flow-eyebrow">CONSEJOS PARA EMPEZAR</span>
        <h2 id="home-tips-title">Cada dato tiene su momento.</h2>
        <div className="home-tip-grid">
          <article>
            <span>ANTES DE COCINAR</span>
            <h3>Un plan es una estimación.</h3>
            <p>
              Guardar el plan no registra compras ni ventas. Puedes editarlo
              mientras esté pendiente y consultar sus versiones anteriores.
            </p>
          </article>
          <article>
            <span>DESPUÉS DE COMPRAR</span>
            <h3>Registra la compra una sola vez.</h3>
            <p>
              Ingresa cantidad recibida y total pagado en Compras y resultados.
              No sumes otra vez esa misma compra mediante un conteo de despensa.
            </p>
          </article>
          <article>
            <span>AL TERMINAR DE VENDER</span>
            <h3>Cuenta también lo que sobró.</h3>
            <p>
              Indica preparados y vendidos. El cierre descuenta los ingredientes
              de todo lo cocinado y calcula los menús que no se vendieron.
            </p>
          </article>
        </div>
      </section>

      <section
        id="preguntas-frecuentes"
        className="landing-faq home-section"
        aria-labelledby="faq-title"
      >
        <div>
          <span className="flow-eyebrow">ANTES DE EMPEZAR</span>
          <h2 id="faq-title">Preguntas de todos los días.</h2>
          <p>Algunas respuestas para usar la herramienta con tranquilidad.</p>
        </div>
        <div className="faq-items">
          <details>
            <summary>¿Qué incluye un menú completo?</summary>
            <p>
              Un caldo, un segundo y un refresco con un único precio de venta.
              Las recetas definen ingredientes y porciones; el precio
              corresponde al menú completo.
            </p>
          </details>
          <details>
            <summary>¿Guardar el plan descuenta ingredientes?</summary>
            <p>
              No. Guardar crea una estimación. Las compras se registran cuando
              las recibes y los ingredientes se descuentan al confirmar el
              cierre, según lo que realmente preparaste. Si un ingrediente nunca
              tuvo inventario, el primer plan puede inicializarlo con la
              existencia que declaraste.
            </p>
          </details>
          <details>
            <summary>¿Puedo cambiar un plan que ya guardé?</summary>
            <p>
              Sí, mientras siga pendiente. Puedes ajustar el menú, la fecha, la
              cantidad y el presupuesto, revisar el nuevo cálculo y guardar un
              motivo. La versión anterior queda en el historial. Los cerrados y
              cancelados no se editan.
            </p>
          </details>
          <details>
            <summary>¿Qué pasa si no vendí todos los menús?</summary>
            <p>
              En el cierre registra cuántos preparaste y cuántos vendiste. La
              diferencia queda como menús sobrantes; los ingredientes de toda la
              comida preparada ya se consumieron.
            </p>
          </details>
          <details>
            <summary>¿El margen es mi ganancia final?</summary>
            <p>
              El margen descuenta de las ventas los ingredientes preparados y
              los otros gastos que declaraste. No garantiza incluir todos los
              costos del negocio ni representa el dinero disponible en caja.
            </p>
          </details>
          <details>
            <summary>¿De dónde viene la información externa?</summary>
            <p>
              Desde Mi cocina puedes consultar MIDAGRI, Plaza Vea y ADRA. Se
              muestra la procedencia y las fechas de recuperación. Son
              referencias con coberturas distintas y no reemplazan
              automáticamente tus existencias ni tus precios de compra.
            </p>
          </details>
        </div>
      </section>

      <section className="home-last-call">
        <div>
          <span className="flow-eyebrow">EMPIEZA CON LO QUE YA TIENES</span>
          <h2>El próximo menú empieza aquí.</h2>
          <p>Revisa tu cocina y prepara tu primera lista de compras.</p>
        </div>
        <button className="primary" onClick={() => onGo("kitchen")}>
          Organizar mi cocina <span aria-hidden="true">↗</span>
        </button>
      </section>
    </div>
  );
}
