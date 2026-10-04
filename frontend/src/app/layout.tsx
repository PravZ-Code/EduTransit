import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { ToastProvider } from "@/components/citymapper/Toast";

export const metadata: Metadata = {
  title: "Citymapper EduTransit // Transit Navigation & Custody Suite",
  description:
    "100% software-only, zero-hardware predictive transport platform engineered to Citymapper multimodal transit specifications.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className="antialiased min-h-screen w-full bg-[#0C0E14] text-[#ECEEF3] overflow-x-hidden"
        suppressHydrationWarning
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
