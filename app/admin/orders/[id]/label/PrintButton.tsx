"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
    >
      🖨️ Imprimir Etiqueta
    </button>
  );
}
