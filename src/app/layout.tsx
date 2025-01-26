import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EasyMeet: Book Smart Appointments",
  description: "A seamless scheduling platform that allows users to share their availability and let others effortlessly book appointments. Simplify time management, eliminate back-and-forth emails, and make scheduling a breeze.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={cn(`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`)}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
