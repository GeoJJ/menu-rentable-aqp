import React from "react";

export function SectionIntro({ image, title, children }) {
  return (
    <aside className="section-intro">
      <img
        src={`/images/como-funciona/${image}-v1.webp`}
        alt=""
        width="1448"
        height="1086"
      />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}
