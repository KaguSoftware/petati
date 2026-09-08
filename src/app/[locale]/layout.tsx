import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";
import { dirFor, locales, type Locale } from "@/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { AppIntlProvider } from "@/components/intl-provider";
import { DocumentScrollbars } from "@/components/scroll/document-scrollbars";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const vazirmatn = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazirmatn" });

export const metadata: Metadata = {
  title: { default: "Petati", template: "%s · Petati" },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const dir = dirFor(locale as Locale);
  const fontClass = locale === "fa" ? vazirmatn.variable : inter.variable;
  const fontFamily = locale === "fa" ? "var(--font-vazirmatn)" : "var(--font-inter)";
  // Passed explicitly so the provider never touches request-scoped APIs (keeps the shell static).
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${vazirmatn.variable} ${fontClass} h-full antialiased`}
      style={{ ["--font-sans" as string]: fontFamily }}
      data-overlayscrollbars-initialize=""
    >
      <body className="flex min-h-full flex-col bg-background text-foreground" data-overlayscrollbars-initialize="">
        <DocumentScrollbars />
        <AppIntlProvider locale={locale} dir={dir} messages={messages}>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster position={dir === "rtl" ? "bottom-left" : "bottom-right"} />
        </AppIntlProvider>
      </body>
    </html>
  );
}
