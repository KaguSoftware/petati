import type { Metadata } from "next";
import { Amiri, Cairo, DM_Sans, Inter, Manrope, Markazi_Text, Noto_Naskh_Arabic, Noto_Sans_Arabic, Playfair_Display, Vazirmatn } from "next/font/google";
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
// Optional theme fonts (see src/lib/theme/fonts.ts): declared here so any store may pick them, but
// not preloaded — the browser only fetches a face once a storefront actually uses it.
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", preload: false });
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-dm-sans", preload: false });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--font-playfair", preload: false });
// Arabic-script faces (Persian storefronts pick these directly; Latin fonts pair with one of them).
const notoSansArabic = Noto_Sans_Arabic({ subsets: ["arabic", "latin"], variable: "--font-noto-sans-arabic", preload: false });
const notoNaskhArabic = Noto_Naskh_Arabic({ subsets: ["arabic", "latin"], variable: "--font-noto-naskh-arabic", preload: false });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", preload: false });
const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-amiri", preload: false });
const markazi = Markazi_Text({ subsets: ["arabic", "latin"], variable: "--font-markazi", preload: false });
const themeFontClasses = [manrope, dmSans, playfair, notoSansArabic, notoNaskhArabic, cairo, amiri, markazi].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: { default: "Petitati", template: "%s · Petitati" },
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
      className={`${inter.variable} ${vazirmatn.variable} ${themeFontClasses} ${fontClass} h-full antialiased`}
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
