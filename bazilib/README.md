# bazilib

八字算法层 —— 排盘 / 旺衰 / 格局 / 喜用神 / 合盘。纯计算，不含任何 UI 依赖。

底层历法与干支原语由 [`@jabberwocky238/bazi-engine`](https://github.com/Jabberwocky238/bazi-engine) 提供，本包在其上做业务派生。

## 用法

```ts
import { computeFromState, deriveAll } from 'bazilib'

const r = computeFromState({
  mode: 'gregorian',      // 'gregorian' | 'trueSolar' | 'bazi'
  year: 1990, month: 6, day: 15, hour: 14, minute: 30,
  longitude: 121.47,      // 可选，给了就做经度 + 均时差修正
  bazi: ['', '', '', ''], // 仅 mode: 'bazi' 用
  sex: 1,                 // 1 = 男, 0 = 女
})!

const d = deriveAll(r.bazi)
d.analysis?.level        // '身弱'
d.analysis?.score        // -58.6
d.gejuHits               // [{ name: '七杀格', ... }]
d.xiyongAnalysis?.primaryWx  // '土'
```

`deriveAll` 是一站式出口，内部按 旺衰 → 格局 → 喜用神 的顺序串联，后一步依赖前一步的结论。

## 模块

| 模块 | 职责 |
|---|---|
| `base.ts` | 类型收口、柱访问器 (`pGan`/`pZhi`/`pNayin`)、十神视图 |
| `compute.ts` | 三种输入模式 → `BaziResult`；真太阳时；`deriveAll` |
| `strength.ts` | 日元旺衰量化打分、人元司令、旺相休囚死 |
| `geju/` | 格局判定，34 个 detector 表驱动 |
| `xiyong/` | 干支作用 → 扶抑 → 救应 → 调候 → 通关 → 从格覆写 |
| `hepan/` | 合盘：喜用神互供打分 + 跨盘冲刑合 |
| `distribution/` | 出生时间扫描采样，产出五行/格局概率分布 |
| `xingchonghehai.ts` | 合冲刑害的薄适配层，判定全部委托 engine |
| `skills.ts` | 词条文档索引 |

## 包边界

**对外只有 `src/index.ts` 一个入口。** 外部一律 `from 'bazilib'`，不得深入子路径；包内一律相对路径，不得自引包名。全仓禁止 `export *`，导出必须具名。

规则由 `scripts/check-imports.mjs` 强制（5 条，已前置到 `bun run build`）：

```bash
bun run check:imports
```

## 测试

```bash
bun test bazilib/            # 全部
bun run test:strength        # 旺衰
bun run test:geju            # 格局随机对拍 10000 盘
```

格局与合盘用大数定律对拍：随机生成合法四柱，跑全量 detector，检查零错误并输出命中分布。这类测试防的是"某个 detector 悄悄不工作"——类型能过但一条都命中不了的情况，只有对拍能发现。

## 已知状态

`geju/categories/` 下有 **31 个孤立文件**，依赖 commit `8ff72ee` 删除的 `../snapshot` 全局读取 API，且未接入 `geju/index.ts` 的 `DETECTORS` 表（无任何引用）。它们带 `@ts-nocheck`，不参与编译产物。要启用需改写为 `GejuContext` 形式——那是恢复功能，不是迁移。

`geju/v2/` 是正格判定的另一套实现，目前也未被 `DETECTORS` 引用。

## 注意

- **时辰未知时只有 3 柱**。`GanC`/`ZhiC` 没有空值表示，不再补占位柱，下游按 `pillars.length` 或 `hourKnown` 分流。`analyzeStrength` 遇到 3 柱返回 `null`。
- **人元司令参与旺衰评分**。需要 `dayInMonth`（出生日距本月节令的天数），由公历输入自动算出；八字直输无日期，退回月支十二长生。两种口径约 1/3 的盘结论不同。
- 干支的值对象（`GanC`/`ZhiC`/`WuXingC`）渲染时取 `.str`。
