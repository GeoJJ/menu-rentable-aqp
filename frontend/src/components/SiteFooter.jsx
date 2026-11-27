import React, { useEffect, useRef, useState } from "react";

const phone = "51934416482";
const whatsapp = (message) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
      <path d="M8.3 7.6c.2-.4.5-.4.7-.1l1 1.7c.2.3-.3.8-.6 1 .8 1.4 1.5 2.1 2.9 2.8.2-.3.7-.9 1-.7l1.8.9c.3.2.3.6.1.9-.5.9-1.5 1.2-2.3.9-3.1-1-5.3-3.3-6-5.9-.2-.7.3-1.2 1.4-1.5Z" />
    </svg>
  );
}

function ContactDialog({ onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  function prepare(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      `Hola, equipo de Menú Rentable. Quiero enviar ${data.get("tipo")}.`,
      data.get("nombre")?.trim()
        ? `Mi nombre es ${data.get("nombre").trim()}.`
        : "",
      data.get("mensaje").trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
    window.open(whatsapp(message), "_blank", "noopener,noreferrer");
  }
  return (
    <dialog
      className="contact-dialog"
      ref={dialog}
      aria-labelledby="contact-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="contact-dialog-heading">
        <span className="flow-eyebrow">TE ESCUCHAMOS</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar reclamos y sugerencias"
        >
          ×
        </button>
      </div>
      <h2 id="contact-title">Reclamos y sugerencias</h2>
      <p>Cuéntanos qué ocurrió o cómo podemos mejorar Menú Rentable.</p>
      <form onSubmit={prepare}>
        <label>
          Tipo de mensaje
          <select name="tipo" defaultValue="un reclamo">
            <option value="un reclamo">Reclamo</option>
            <option value="una sugerencia">Sugerencia</option>
            <option value="una consulta">Consulta</option>
          </select>
        </label>
        <label>
          Tu nombre (opcional)
          <input
            name="nombre"
            maxLength="100"
            autoComplete="name"
            placeholder="Cómo podemos llamarte"
          />
        </label>
        <label>
          Tu mensaje
          <textarea
            name="mensaje"
            required
            minLength="10"
            maxLength="1500"
            rows="5"
            placeholder="Describe lo ocurrido o tu propuesta de mejora."
          />
        </label>
        <p className="contact-delivery-note">
          Este formulario prepara un mensaje. Se abrirá WhatsApp para que lo
          revises y lo envíes al +51 934 416 482. No se guarda en la base de
          datos.
        </p>
        <button className="primary contact-send" type="submit">
          <WhatsAppIcon />
          Continuar en WhatsApp <span aria-hidden="true">↗</span>
        </button>
      </form>
      <small className="contact-scope">
        Canal de atención del proyecto académico; no constituye un Libro de
        Reclamaciones oficial.
      </small>
    </dialog>
  );
}

export function SiteFooter({ page, onGo }) {
  const [contactOpen, setContactOpen] = useState(false);
  const opener = useRef(null);
  function closeContact() {
    setContactOpen(false);
    requestAnimationFrame(() => opener.current?.focus());
  }
  return (
    <>
      <footer className="contact-footer" id="contacto">
        <div className="footer-inner">
          <div className="footer-contact-band">
            <div>
              <span className="flow-eyebrow">CONVERSEMOS SOBRE TU COCINA</span>
              <h2>¿Una duda antes de empezar?</h2>
              <p>
                Escríbenos para consultas, comentarios o ayuda con el proyecto.
              </p>
            </div>
            <a
              className="whatsapp-button"
              href={whatsapp("Hola, quisiera información sobre Menú Rentable.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              Escríbenos por WhatsApp<span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="footer-columns">
            <div className="footer-brand-column">
              <button
                className="footer-logo"
                onClick={() => onGo("home")}
                aria-label="Menú Rentable, volver al inicio"
              >
                <img
                  src="/brand/menu-rentable-logo-v1.png"
                  alt="Menú Rentable Arequipa"
                  width="2192"
                  height="728"
                  loading="lazy"
                />
              </button>
              <p>
                Planifica tus porciones.
                <br />
                Organiza tus compras.
                <br />
                Conoce el resultado de tu día.
              </p>
              <span className="footer-place">AREQUIPA, PERÚ</span>
            </div>
            <nav aria-label="Explorar Menú Rentable">
              <h3>Tu espacio de trabajo</h3>
              <button onClick={() => onGo("home")}>Inicio</button>
              <button onClick={() => onGo("plan")}>Preparar mi plan</button>
              <button onClick={() => onGo("saved")}>Mis planes</button>
              <button onClick={() => onGo("kitchen")}>Mi cocina</button>
              <button onClick={() => onGo("results")}>
                Compras y resultados
              </button>
            </nav>
            <nav aria-label="Ayuda y contacto">
              <h3>Estamos para ayudarte</h3>
              {page === "home" && (
                <>
                  <a href="#como-funciona">Cómo funciona</a>
                  <a href="#consejos">Consejos para empezar</a>
                  <a href="#preguntas-frecuentes">Preguntas frecuentes</a>
                </>
              )}
              <a
                href={whatsapp("Hola, necesito ayuda con Menú Rentable.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp: 934 416 482 ↗
              </a>
              <button ref={opener} onClick={() => setContactOpen(true)}>
                Reclamos y sugerencias
              </button>
              <a
                href="https://github.com/GeoJJ/menu-rentable-aqp"
                target="_blank"
                rel="noopener noreferrer"
              >
                Código del proyecto ↗
              </a>
            </nav>
          </div>
          <div className="footer-bottom">
            <span>
              Menú Rentable · Proyecto académico de Lenguajes de Programación
            </span>
            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                })
              }
            >
              Volver arriba ↑
            </button>
          </div>
        </div>
      </footer>
      {contactOpen && <ContactDialog onClose={closeContact} />}
    </>
  );
}
