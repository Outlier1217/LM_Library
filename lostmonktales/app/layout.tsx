
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LostMonkTales | Beyond Belief. Toward Understanding.",
    template: "%s | LostMonkTales",
  },
  description:
    "Explore religions, civilisations, philosophy, architecture, art and interactive learning through LostMonkTales, an initiative of Studio LM.",
  icons: {
    icon: [{ url: "/fav-icon.png", type: "image/png" }],
    shortcut: "/fav-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
