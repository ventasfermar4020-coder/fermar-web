"use client";

import { navButtonClass } from "./navButton";

export default function ProductsNavLink() {
  const handleClick = () => {
    document
      .getElementById("productos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button onClick={handleClick} className={navButtonClass}>
      PRODUCTOS
    </button>
  );
}
