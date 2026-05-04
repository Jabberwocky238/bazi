import type { Metadata } from "next";
import AppClient from "./AppClient";

const HOME_DESCRIPTION =
  "在线八字排盘工具：输入公历 / 农历 / 八字直输 / 真太阳时，自动计算四柱、十神、藏干、神煞、大运流年，并给出格局、五行旺衰、用神喜忌与释义解读。";

export const metadata: Metadata = {
  title: {
    absolute: "八字补完计划 · 在线排盘 / 格局 / 用神 / 大运",
  },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "八字补完计划 · 在线排盘 / 格局 / 用神 / 大运",
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "八字补完计划 · 在线排盘 / 格局 / 用神 / 大运",
    description: HOME_DESCRIPTION,
  },
};

export default function Page() {
  return <AppClient />;
}
