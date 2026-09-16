"use client";

import { useEffect, useState } from "react";

interface CarruselImagenesProps {
  imagenes: string[];
  alt: string;
  intervaloMs?: number; // cada cuánto cambia de imagen automáticamente
  className?: string;
}

export default function CarruselImagenes({
  imagenes,
  alt,
  intervaloMs = 3000,
  className = "",
}: CarruselImagenesProps) {
  const [indice, setIndice] = useState(0);

  // Filtra vacíos por si algún producto viejo trae valores nulos en el array
  const fotos = (imagenes || []).filter(Boolean);

  useEffect(() => {
    if (fotos.length <= 1) return; // no hace falta animar si hay 0 o 1 foto

    const timer = setInterval(() => {
      setIndice((i) => (i + 1) % fotos.length);
    }, intervaloMs);

    return () => clearInterval(timer);
  }, [fotos.length, intervaloMs]);

  if (fotos.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <span className="text-gray-400 text-sm">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pista deslizante: todas las imágenes en fila, desplazada según el índice actual */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${indice * 100}%)` }}
      >
        {fotos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} - foto ${i + 1}`}
            className="w-full h-full object-cover flex-shrink-0"
            style={{ minWidth: "100%" }}
          />
        ))}
      </div>

      {/* Puntitos indicadores, solo si hay más de una foto */}
      {fotos.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {fotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === indice ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
