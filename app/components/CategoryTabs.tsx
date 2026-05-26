"use client";

import { useState } from "react";

const CATEGORIES = ["Todos", "Juguetes", "Regalos", "Perfumes", "Cremas"];

export default function CategoryTabs({ productCount }: { productCount: number }) {
  const [active, setActive] = useState("Todos");

  const handleClick = (name: string) => {
    setActive(name);
    document
      .getElementById("productos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 mb-10 pb-5 border-b border-[#ECECEC]">
      <div className="flex flex-wrap gap-x-10 gap-y-2">
        {CATEGORIES.map((name) => {
          const isActive = active === name;
          return (
            <button
              key={name}
              onClick={() => handleClick(name)}
              className={`relative pb-2 text-lg leading-[22px] transition-colors duration-200 cursor-pointer ${
                isActive
                  ? "font-bold text-black"
                  : "font-medium text-[#676767] hover:text-[#212B36]"
              }`}
            >
              {name}
              <span
                className={`absolute left-0 -bottom-px h-[2px] bg-[#212B36] transition-all duration-300 ${
                  isActive ? "w-full" : "w-0"
                }`}
              />
            </button>
          );
        })}
      </div>
      <p className="text-[#9EA8B3] text-sm font-medium tracking-wide">
        {productCount} {productCount === 1 ? "producto" : "productos"}
      </p>
    </div>
  );
}
