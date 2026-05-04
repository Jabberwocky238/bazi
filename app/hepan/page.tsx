import type { Metadata } from "next";
import HepanClient from "./HepanClient";

const HEPAN_DESCRIPTION =
  "八字合盘在线分析：输入两人出生信息，自动比对干支互动、十神关系与用神配对，辅助配偶 / 合伙 / 人际关系判断。";

export const metadata: Metadata = {
  title: "八字合盘",
  description: HEPAN_DESCRIPTION,
  alternates: { canonical: "/hepan" },
  openGraph: {
    type: "website",
    url: "/hepan",
    title: "八字合盘 · 双人干支 / 用神互动分析",
    description: HEPAN_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "八字合盘 · 双人干支 / 用神互动分析",
    description: HEPAN_DESCRIPTION,
  },
};

export default function Page() {
  return <HepanClient />;
}
