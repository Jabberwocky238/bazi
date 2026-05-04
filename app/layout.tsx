import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "八字补完计划";
const SITE_DESCRIPTION =
  "在线八字排盘与合盘分析工具：自动计算四柱、十神、藏干、神煞、大运流年，支持格局判定、五行旺衰、用神喜忌与双人合盘互动 / 用神配对，公历 / 农历 / 真太阳时多种输入方式。";
const SITE_KEYWORDS = [
  "八字",
  "八字排盘",
  "在线排盘",
  "四柱",
  "十神",
  "大运",
  "流年",
  "格局",
  "用神",
  "喜忌",
  "五行",
  "合盘",
  "真太阳时",
  "命理",
  "周易",
  "bazi",
];

export const metadata: Metadata = {
  metadataBase: new URL("https://bazi.app238.com"),
  title: {
    default: `${SITE_NAME} · 在线八字排盘 / 合盘分析`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: "Jabberwocky238", url: "https://github.com/Jabberwocky238" }],
  creator: "Jabberwocky238",
  publisher: "Jabberwocky238",
  category: "lifestyle",
  alternates: {
    canonical: "/",
    languages: {
      "zh-CN": "https://bazi.app238.cn",
      "x-default": "https://bazi.app238.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://bazi.app238.com",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · 在线八字排盘 / 合盘分析`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · 在线八字排盘 / 合盘分析`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
