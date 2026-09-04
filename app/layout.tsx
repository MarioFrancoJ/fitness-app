import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLocaleCookie } from "@/lib/i18n/actions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import PublicDictionaryProvider from "@/components/i18n/PublicDictionaryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Movive — Transform Your Fitness Journey",
  description:
    "Personalized workouts, nutrition plans and progress tracking in one modern platform.",
  // Movive app icon (isotipo — the icon-only mark, used for favicon/app-icon refs).
  icons: {
    icon: "/movive/isotipo-movive.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleCookie();
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-zinc-900">
        <PublicDictionaryProvider locale={locale} dict={dict}>
          {children}
        </PublicDictionaryProvider>
      </body>
    </html>
  );
}
