"use client";

import * as React from "react";
import Image from "next/image";

const HERO_IMAGES = [
  "/FlyGo/1.jpg",
  "/FlyGo/2.jpg",
  "/FlyGo/3.jpg",
  "/FlyGo/4.jpg",
  "/FlyGo/5.jpg",
  "/FlyGo/6.jpg",
];

export function HeroSection() {
  const [currentIdx, setCurrentIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full min-h-[500px] md:min-h-[600px] py-24 md:py-32 overflow-hidden flex flex-col justify-center items-center">
      {/* Background slideshow with crossfade animation */}
      <div className="absolute inset-0 z-0 bg-zinc-950">
        {HERO_IMAGES.map((src, idx) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIdx ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={src}
              alt={`FlyGo Travel Landscape ${idx + 1}`}
              fill
              priority={idx === 0}
              className="object-cover blur-[5px] scale-105"
            />
          </div>
        ))}
      </div>

      {/* Modern gradient & dark overlays to enhance visual depth */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-zinc-950/60 via-zinc-950/45 to-zinc-950/70" />
      <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />

      {/* Decorative premium ambient glowing orbs */}

      {/* Centerpiece Premium Glassmorphic Brand Card */}
      <div className="container mx-auto px-4 md:px-6 relative z-20 text-center max-w-xl">
        <div className="space-y-3">
          <h1 className="text-8xl md:text-10xl font-black tracking-[0.1em] font-heading uppercase text-white drop-shadow-sm select-none">
            FlyGo
          </h1>
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-primary bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent select-none">
            Tap. Fly. Go
          </p>
        </div>
      </div>
    </section>
  );
}
