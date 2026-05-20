"use client"

import * as React from "react"
import Image from "next/image"

const HERO_IMAGES = [
  "/FlyGo/1.jpg",
  "/FlyGo/2.jpg",
  "/FlyGo/3.jpg",
  "/FlyGo/4.jpg",
  "/FlyGo/5.jpg",
  "/FlyGo/6.jpg",
]

export function HeroSection() {
  const [currentIdx, setCurrentIdx] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

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
              className="object-cover blur-[8px] scale-105"
            />
          </div>
        ))}
      </div>

      {/* Modern gradient & dark overlays to enhance visual depth */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-zinc-950/60 via-zinc-950/45 to-zinc-950/70" />
      <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />

      {/* Decorative premium ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-[100px] pointer-events-none z-10 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none z-10 animate-pulse duration-[10000ms]" />

      {/* Centerpiece Premium Glassmorphic Brand Card */}
      <div className="container mx-auto px-4 md:px-6 relative z-20 text-center max-w-xl">
        <div className="group relative flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border border-white/10 bg-zinc-950/30 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] text-center space-y-6 transition-all duration-500 hover:border-white/20 hover:bg-zinc-950/40">
          {/* Subtle neon drop shadow behind logo container */}
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-primary/10 via-transparent to-purple-600/10 opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />

          {/* Premium Logo Showcase */}
          <div className="relative h-20 w-20 md:h-24 md:w-24 transition-transform duration-700 ease-out group-hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(255,255,255,0.08)]">
            <Image
              src="/logo.png"
              alt="FlyGo Official Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-[0.1em] font-heading uppercase text-white drop-shadow-sm select-none">
              FlyGo
            </h1>
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-primary bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent select-none">
              Tap. Fly. Go
            </p>
          </div>

          {/* Minimalist designer divider line */}
          <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <p className="text-xs md:text-sm text-zinc-300 font-sans font-light tracking-wide max-w-md leading-relaxed select-none">
            Experience premium air travel. Seamless seat selection maps, real-time ticket locks, and international schedules across global luxury hubs.
          </p>
        </div>
      </div>
    </section>
  )
}
