import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/routing";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import PrivacyBanner from "@/components/ui/PrivacyBanner";
import { getImprintData } from "@/lib/imprint";
import "../globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });

  return {
    title: t("title"),
    description: t("seo_description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  if (!routing.locales.includes(locale as "de" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  let imprintData: Awaited<ReturnType<typeof getImprintData>> = null;

  try {
    imprintData = await getImprintData();
  } catch {
    imprintData = null;
  }

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer imprintData={imprintData} />
          <PrivacyBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
