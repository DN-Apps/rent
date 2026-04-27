"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import room1 from "@/images/room1.jpg";
import room2 from "@/images/room2.jpg";
import room3 from "@/images/room3.jpg";

interface Slide {
  src: string | StaticImageData;
  alt: string;
}

const DEFAULT_SLIDES: Slide[] = [
  { src: room1, alt: "Zimmer 1" },
  { src: room2, alt: "Zimmer 2" },
  { src: room3, alt: "Zimmer 3" },
];

interface SlideshowProps {
  slides?: Slide[];
  /** Auto-Wechsel-Intervall in ms. 0 = deaktiviert. Standard: 5000 */
  interval?: number;
}

export default function Slideshow({
  slides = DEFAULT_SLIDES,
  interval = 5000,
}: SlideshowProps) {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!interval) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [interval, next]);

  if (slides.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl aspect-[16/7] bg-zinc-100">
      {slides.map((slide, i) => (
        <Image
          key={`${slide.alt}-${i}`}
          src={slide.src}
          alt={slide.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className={`object-cover transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
          priority={i === 0}
        />
      ))}

      {/* Zurueck / Weiter */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
        aria-label="Vorheriges Bild"
      >
        <HiChevronLeft size={22} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
        aria-label="Nächstes Bild"
      >
        <HiChevronRight size={22} />
      </button>

      {/* Punkte */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === current ? "bg-white" : "bg-white/40"
            }`}
            aria-label={`Bild ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
