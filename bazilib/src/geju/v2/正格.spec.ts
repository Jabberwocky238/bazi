import { randomBaziInput } from "../random_bazi.spec";
import { GejuContext } from "../types";
import { calcZhengGe } from "./正格";

// bun test lib/geju/v2/正格.spec.ts
const NUM_RANDOM_BAZI = 10000;

const stats: Record<string, number> = {};
let nullCount = 0;

for (let i = 0; i < NUM_RANDOM_BAZI; i++) {
  const bazi = randomBaziInput();
  const context = new GejuContext(bazi);
  const result = calcZhengGe(context);
  if (result) {
    stats[result.name] = (stats[result.name] ?? 0) + 1;
  } else {
    nullCount++;
  }
}

console.log(`\n===== 正格统计 (共 ${NUM_RANDOM_BAZI} 例) =====`);
const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
for (const [name, count] of sorted) {
  const pct = ((count / NUM_RANDOM_BAZI) * 100).toFixed(2);
  console.log(`${name}: ${count} (${pct}%)`);
}
console.log(`不成格: ${nullCount} (${((nullCount / NUM_RANDOM_BAZI) * 100).toFixed(2)}%)`);
console.log(`=================================\n`);
