export type SkillCategory =
  | 'shishen'
  | 'shensha'
  | 'tiangan'
  | 'dizhi'
  | 'gongwei'
  | 'geju'

const PATHS: Record<SkillCategory, Record<string, string>> = {
  shishen: {
    比肩: '十神/比肩.md',
    劫财: '十神/劫财.md',
    食神: '十神/食神.md',
    伤官: '十神/伤官.md',
    偏财: '十神/偏财.md',
    正财: '十神/正财.md',
    七杀: '十神/七杀.md',
    正官: '十神/正官.md',
    偏印: '十神/偏印.md',
    正印: '十神/正印.md',
    日主: '',
  },
  shensha: {
    桃花: '神煞/桃花.md',
    华盖: '神煞/华盖.md',
    羊刃: '神煞/羊刃.md',
    驿马: '神煞/驿马.md',
    红鸾: '神煞/红鸾.md',
    天喜: '神煞/天喜.md',
    十恶大败: '神煞/十恶大败.md',
    天罗地网: '神煞/天罗地网.md',
    太极贵人: '神煞/太极贵人.md',
    阴差阳错: '神煞/阴差阳错.md',
    天乙贵人: '神煞/天乙贵人.md',
    天德贵人: '神煞/天德贵人.md',
    寡宿: '神煞/寡宿.md',
    魁罡: '神煞/魁罡.md',
    童子煞: '神煞/童子煞.md',
    勾绞煞: '神煞/勾绞煞.md',
    吊客: '神煞/吊客.md',
    孤鸾: '神煞/孤鸾.md',
    孤鸾煞: '神煞/孤鸾.md',
  },
  tiangan: {
    甲: '天干/甲木.md',
    乙: '天干/乙木.md',
    丙: '天干/丙火.md',
    丁: '天干/丁火.md',
    戊: '天干/戊土.md',
    己: '天干/己土.md',
    庚: '天干/庚金.md',
    辛: '天干/辛金.md',
    壬: '天干/壬水.md',
    癸: '天干/癸水.md',
  },
  dizhi: {
    亥: '地支/亥水.md',
  },
  gongwei: {
    年柱: '宫位/年柱.md',
    月柱: '宫位/月柱.md',
    时柱: '宫位/时柱.md',
    夫妻宫: '宫位/夫妻宫.md',
  },
  geju: {
    // 顶层
    从杀格: '格局/从杀格.md',
    从财格: '格局/从财格.md',
    以财破印: '格局/以财破印.md',
    伤官佩印: '格局/伤官佩印.md',
    伤官合杀: '格局/伤官合杀.md',
    伤官生财: '格局/伤官生财.md',
    伤官见官: '格局/伤官见官.md',
    官印相生: '格局/官印相生.md',
    官杀混杂: '格局/官杀混杂.md',
    建禄格: '格局/建禄格.md',
    弃命从势: '格局/弃命从势.md',
    杀印相生: '格局/杀印相生.md',
    枭神夺食: '格局/枭神夺食.md',
    比劫重重: '格局/比劫重重.md',
    禄马同乡: '格局/禄马同乡.md',
    羊刃劫财: '格局/羊刃劫财.md',
    羊刃驾杀: '格局/羊刃驾杀.md',
    财多身弱: '格局/财多身弱.md',
    财官印全: '格局/财官印全.md',
    食伤泄秀: '格局/食伤泄秀.md',
    食伤混杂: '格局/食伤混杂.md',
    食神制杀: '格局/食神制杀.md',
    魁罡格: '格局/魁罡格.md',
    // 五行象法
    壬骑龙背: '格局/五行象法/壬骑龙背.md',
    土重金埋: '格局/五行象法/土重金埋.md',
    土金毓秀: '格局/五行象法/土金毓秀.md',
    寒木向阳: '格局/五行象法/寒木向阳.md',
    斧斤伐木: '格局/五行象法/斧斤伐木.md',
    日照江河: '格局/五行象法/日照江河.md',
    木多火塞: '格局/五行象法/木多火塞.md',
    木火通明: '格局/五行象法/木火通明.md',
    木疏厚土: '格局/五行象法/木疏厚土.md',
    水木清华: '格局/五行象法/水木清华.md',
    水火既济: '格局/五行象法/水火既济.md',
    水火相战: '格局/五行象法/水火相战.md',
    火旺金衰: '格局/五行象法/火旺金衰.md',
    金寒水冷: '格局/五行象法/金寒水冷.md',
    金火铸印: '格局/五行象法/金火铸印.md',
    // 专旺格 (五行专旺)
    专旺格: '格局/专旺格/专旺格.md',
    曲直格: '格局/专旺格/曲直格.md',
    炎上格: '格局/专旺格/炎上格.md',
    稼穑格: '格局/专旺格/稼穑格.md',
    从革格: '格局/专旺格/从革格.md',
    润下格: '格局/专旺格/润下格.md',
  },
}

export function skillNames(category: SkillCategory): string[] {
  return Object.keys(PATHS[category])
}

export function skillUrl(category: SkillCategory, name: string): string | null {
  const rel = PATHS[category]?.[name]
  if (!rel) return null
  return `/bazi-skills/core/${rel}`
}

const cache = new Map<string, Promise<string>>()

export function loadSkill(url: string): Promise<string> {
  const hit = cache.get(url)
  if (hit) return hit
  const p = fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
    return r.text()
  })
  cache.set(url, p)
  return p
}
