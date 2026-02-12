import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "SepeNatural 2026",
    description: "Next Generation ERP System",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr">
            <body>{children}</body>
        </html>
    );
}
