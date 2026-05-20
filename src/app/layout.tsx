import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "FlyGo Airlines - Premium Flight Booking",
  description: "Experience premium air travel with FlyGo. Search flights, select visual seat maps, and manage your luxury travel itineraries seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans")}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <Navbar />
        <main className="flex-grow flex flex-col">{children}</main>
        <footer className="border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 py-6 text-center text-sm text-zinc-500">
          <div className="container mx-auto px-4">
            <p>© {new Date().getFullYear()} FlyGo Airlines. All rights reserved. Premium sky hospitality.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
