import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const manrope = Manrope({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AeroLux Airlines - Premium Flight Booking",
  description: "Experience premium air travel with AeroLux. Search flights, select visual seat maps, and manage your luxury travel itineraries seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", manrope.variable, geistHeading.variable)}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <Navbar />
        <main className="flex-grow flex flex-col">{children}</main>
        <footer className="border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 py-6 text-center text-sm text-zinc-500">
          <div className="container mx-auto px-4">
            <p>© {new Date().getFullYear()} AeroLux Airlines. All rights reserved. Premium sky hospitality.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

