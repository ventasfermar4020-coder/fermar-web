"use client";

import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  stock: number;
  isDigital: boolean;
};

const PRESET_PROMPTS = [
  {
    label: "Fondo neutro premium",
    prompt:
      "Edita esta foto de producto para e-commerce. Mantén intacto el producto principal. Reemplaza el fondo por un fondo neutro premium de color gris claro degradado con iluminación de estudio suave. Agrega sombras sutiles naturales debajo del producto. La imagen debe verse profesional y lista para catálogo.",
  },
  {
    label: "Look de estudio",
    prompt:
      "Edita esta foto de producto para e-commerce. Mantén intacto el producto principal. Aplica iluminación profesional de estudio fotográfico con luces key y fill. Agrega reflejos controlados, sombras suaves y un fondo blanco puro. La imagen debe parecer tomada en un estudio profesional.",
  },
  {
    label: "Contexto suave minimalista",
    prompt:
      "Edita esta foto de producto para e-commerce. Mantén intacto el producto principal. Coloca el producto en un entorno minimalista suave con superficie clara y fondo desenfocado en tonos neutros. Agrega iluminación natural difusa y sombras delicadas. La imagen debe transmitir elegancia y simplicidad.",
  },
];

const DEFAULT_PROMPT =
  "Edita esta foto de producto para e-commerce. Mantén intacto el producto principal (misma forma, proporciones, textura, color base, logotipo y detalles de marca). Solo mejora elementos secundarios: iluminación, sombras suaves, fondo limpio/neutral, reflejos controlados y nitidez general. No cambies el diseño del producto, no agregues ni quites partes, no cambies el encuadre principal. Entrega una imagen realista y comercial lista para catálogo.";

type ImageFile = {
  file: File;
  preview: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProductFormData>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multiple images state
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // AI Transform state
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_PROMPT);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedPreview, setTransformedPreview] = useState<string | null>(null);
  const [transformedPath, setTransformedPath] = useState<string | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);

  const isDigital = watch("isDigital");

  const onImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setSelectedImages((prev) => [...prev, ...newImages]);

    // Reset transform when images change
    setTransformedPreview(null);
    setTransformedPath(null);
    setTransformError(null);

    // Reset the input so the same file can be re-selected
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const updated = [...prev];
      // Revoke the object URL to free memory
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    setSelectedImages((prev) => {
      const updated = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
  };

  const handleTransform = async () => {
    if (selectedImages.length === 0) {
      setTransformError("Primero selecciona una imagen para transformar");
      return;
    }

    setIsTransforming(true);
    setTransformError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedImages[0].file);
      formData.append("prompt", aiPrompt);

      const response = await fetch("/api/admin/transform-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.details
          ? `${result.error}: ${result.details}`
          : result.error || "Error al transformar la imagen";
        throw new Error(errorMsg);
      }

      setTransformedPreview(result.path);
      setTransformedPath(result.path);
    } catch (err) {
      setTransformError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsTransforming(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const uploadedPaths: string[] = [];

      // If a transformed image exists, use it as the first image
      if (transformedPath) {
        uploadedPaths.push(transformedPath);
      }

      // Upload all selected images
      if (selectedImages.length > 0) {
        setIsUploadingImage(true);

        // If we have a transformed image, skip uploading the first image
        // (it was already transformed and uploaded)
        const startIndex = transformedPath ? 1 : 0;

        for (let i = startIndex; i < selectedImages.length; i++) {
          const formData = new FormData();
          formData.append("image", selectedImages[i].file);

          const uploadResponse = await fetch("/api/admin/upload-image", {
            method: "POST",
            body: formData,
          });

          const uploadResult = await uploadResponse.json();

          if (!uploadResponse.ok) {
            const errorMsg = uploadResult.details
              ? `${uploadResult.error}: ${uploadResult.details}`
              : uploadResult.error || "Error al subir la imagen";
            throw new Error(errorMsg);
          }

          if (!uploadResult.path) {
            throw new Error("Error: La imagen se subió pero no se recibió la ruta");
          }

          uploadedPaths.push(uploadResult.path);
        }

        setIsUploadingImage(false);
      }

      // Create product
      const productData = {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.isDigital ? 0 : data.stock,
        isDigital: data.isDigital,
        image: uploadedPaths.length > 0 ? uploadedPaths[0] : null,
        images: uploadedPaths,
      };

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || "Error al crear el producto";
        throw new Error(errorMsg);
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setIsUploadingImage(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Agregar Nuevo Producto
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre *
              </label>
              <input
                id="name"
                type="text"
                {...register("name", {
                  required: "El nombre es requerido",
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Descripción *
              </label>
              <textarea
                id="description"
                rows={4}
                {...register("description", {
                  required: "La descripción es requerida",
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Precio */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Precio (MXN) *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                {...register("price", {
                  required: "El precio es requerido",
                  min: { value: 0, message: "El precio debe ser mayor a 0" },
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Digital */}
            <div className="flex items-center">
              <input
                id="isDigital"
                type="checkbox"
                {...register("isDigital")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isDigital"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                Producto Digital
              </label>
            </div>

            {/* Inventario - solo si no es digital */}
            {!isDigital && (
              <div>
                <label
                  htmlFor="stock"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Inventario *
                </label>
                <input
                  id="stock"
                  type="number"
                  {...register("stock", {
                    required: !isDigital ? "El inventario es requerido" : false,
                    min: { value: 0, message: "El inventario no puede ser negativo" },
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
                )}
              </div>
            )}

            {/* Imágenes (múltiples) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes del producto
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Puedes seleccionar varias imágenes. La primera será la imagen principal. Arrastra para reordenar.
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={imageInputRef}
                onChange={onImagesChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Image previews */}
              {selectedImages.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-gray-600">
                    {selectedImages.length} imagen{selectedImages.length > 1 ? "es" : ""} seleccionada{selectedImages.length > 1 ? "s" : ""}:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedImages.map((img, index) => (
                      <div
                        key={index}
                        className="relative group border border-gray-200 rounded-md overflow-hidden"
                      >
                        {/* Primary badge */}
                        {index === 0 && (
                          <span className="absolute top-1 left-1 z-10 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.preview}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-28 object-cover"
                        />
                        {/* Controls overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, "up")}
                              className="bg-white/90 rounded-full w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-white text-sm"
                              title="Mover antes"
                            >
                              ←
                            </button>
                          )}
                          {index < selectedImages.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, "down")}
                              className="bg-white/90 rounded-full w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-white text-sm"
                              title="Mover después"
                            >
                              →
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-red-500/90 rounded-full w-7 h-7 flex items-center justify-center text-white hover:bg-red-600 text-sm"
                            title="Eliminar"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Transform Section */}
            {selectedImages.length > 0 && (
              <div className="border border-purple-200 bg-purple-50 rounded-lg p-5 space-y-4">
                <h3 className="text-lg font-semibold text-purple-900">
                  Transformar con IA
                </h3>
                <p className="text-sm text-purple-700">
                  Mejora la imagen principal del producto usando inteligencia artificial. Selecciona un preset o escribe tu propio prompt.
                </p>

                {/* Preset buttons */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_PROMPTS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAiPrompt(preset.prompt)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        aiPrompt === preset.prompt
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-purple-700 border-purple-300 hover:bg-purple-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAiPrompt(DEFAULT_PROMPT)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      aiPrompt === DEFAULT_PROMPT
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-purple-700 border-purple-300 hover:bg-purple-100"
                    }`}
                  >
                    Default
                  </button>
                </div>

                {/* Prompt textarea */}
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Escribe tu prompt personalizado..."
                  className="w-full px-4 py-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />

                {/* Transform button */}
                <button
                  type="button"
                  onClick={handleTransform}
                  disabled={isTransforming || !aiPrompt.trim()}
                  className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isTransforming ? "Transformando con IA..." : "Transformar imagen principal con IA"}
                </button>

                {/* Transform error */}
                {transformError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{transformError}</p>
                  </div>
                )}

                {/* Transformed preview */}
                {transformedPreview && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-purple-900">Imagen transformada:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={transformedPreview}
                      alt="Transformed preview"
                      className="max-w-xs rounded-md border border-purple-300"
                    />
                    <p className="text-xs text-purple-600">
                      Esta imagen reemplazará la imagen principal al guardar el producto.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTransformedPreview(null);
                        setTransformedPath(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Descartar transformación
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isTransforming}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isUploadingImage
                  ? "Subiendo imágenes..."
                  : isSubmitting
                  ? "Guardando producto..."
                  : "Guardar Producto"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
