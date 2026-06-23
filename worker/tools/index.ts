// ————————————————————————————————————————————————————————
// 工具箱入口 —— 集中聚合所有可被 LLM 调用的工具定义 (仅逻辑, 不做注册)。
// 注册由 toolcall.ts 统一完成: `import { allTools } from './tools'` 后 push 进全局 tools 数组。
//
// 添加新工具: 在本目录新建一个 <tool>.ts 导出 Tool, 然后加进下方 allTools。
// ————————————————————————————————————————————————————————

import type { Tool } from '../tooldef'
import { ping } from './ping'
import { computePillars } from './compute-pillars'
import { ganzhiRelation } from './ganzhi-relation'
import { strengthAnalysis } from './strength-analysis'
import { xiyongAnalysis } from './xiyong-analysis'
import { gejuAnalysis } from './geju-analysis'

export const allTools: Tool[] = [
  ping,
  computePillars,
  ganzhiRelation,
  strengthAnalysis,
  xiyongAnalysis,
  gejuAnalysis,
]
