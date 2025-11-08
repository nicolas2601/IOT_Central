import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import ErrorModal from "@/components/common/ErrorModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plataforma IoT - Gestión de Dispositivos",
  description: "Plataforma open source para gestión de dispositivos IoT, telemetría en tiempo real y control remoto",
  keywords: ["IoT", "dispositivos", "telemetría", "MQTT", "dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`dark ${inter.className}`}>
        <Providers>
          {children}
          {/* Modal global de errores */}
          <ErrorModal />
        </Providers>
      </body>
    </html>
  );
}
