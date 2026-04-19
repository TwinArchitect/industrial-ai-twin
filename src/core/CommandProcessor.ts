import type { CommandAction, ActionType } from '@/types'

/**
 * CommandProcessor
 * 职责：将用户自然语言输入解析为结构化的 Action JSON
 * 当前实现：本地关键词正则匹配（无需真实 LLM，Demo 效果完全够用）
 * 扩展方向：可一键替换为 Vercel AI SDK + OpenAI API（仅需修改 parse 函数内部）
 */

// ─── 规则表 ────────────────────────────────────────────────────────────────

interface CommandRule {
  patterns: RegExp[]
  action: ActionType
  getTarget?: (input: string) => string | undefined
  replyTemplate: string | ((input: string) => string)
}

/** 零件名称映射 → PartZone（motor / pump / pipe / valve / base） */
const PART_ALIASES: Record<string, string> = {
  motor: 'motor',
  engine: 'motor',
  电机: 'motor',
  pump: 'pump',
  'pump body': 'pump',
  impeller: 'impeller',
  叶轮: 'impeller',
  泵体: 'pump',
  pipe: 'pipe',
  inlet: 'pipe',
  outlet: 'pipe',
  flange: 'pipe',
  管路: 'pipe',
  valve: 'valve',
  阀门: 'valve',
  base: 'base',
  foundation: 'base',
  底座: 'base',
}

const RULES: CommandRule[] = [
  // 爆炸图：展开
  {
    patterns: [/explode/i, /blow.?up/i, /取出|分解|爆炸图/],
    action: 'explode',
    replyTemplate: 'Initiating exploded view. All components separating along normal vectors...',
  },
  // 爆炸图：收回
  {
    patterns: [/collapse/i, /assemble/i, /收回|合并|复原/],
    action: 'collapse',
    replyTemplate: 'Collapsing exploded view. Returning all components to original positions.',
  },
  // 复位视角
  {
    patterns: [/reset|home view|default view/i, /复位|重置视角|回到初始/],
    action: 'reset',
    replyTemplate: 'Resetting to overview camera and clearing temporary selections.',
  },
  // 巡检
  {
    patterns: [/inspect/i, /patrol/i, /scan all/i, /巡检|巡查/],
    action: 'inspect',
    replyTemplate: 'Starting automated inspection routine. Visiting all sensor nodes...',
  },
  // 截面切割
  {
    patterns: [/cut|clip|section|slice/i, /截面|剖切/],
    action: 'clip',
    replyTemplate: 'Activating cross-section clipping plane. Internal structure revealed.',
  },
  // 数据面板
  {
    patterns: [/status|data|dashboard|temperature|pressure|rpm|vibration/i, /状态|数据|温度|压力|转速/],
    action: 'showData',
    getTarget: (input) => extractPartAlias(input),
    replyTemplate: (input) =>
      `Pulling real-time sensor data${extractPartAlias(input) ? ` for ${extractPartAlias(input)}` : ''}...`,
  },
  // 飞向零件
  {
    patterns: [/go to|fly to|focus|show me|navigate to/i, /飞向|定位|查看/],
    action: 'flyTo',
    getTarget: (input) => extractPartAlias(input),
    replyTemplate: (input) => {
      const target = extractPartAlias(input)
      return target
        ? `Camera navigating to ${target}. Estimated arrival: 1.2s.`
        : 'Please specify a component. Available: pump, impeller, inlet, outlet, base, flange, motor.'
    },
  },
  // 高亮
  {
    patterns: [/highlight|select|point to/i, /高亮|选中/],
    action: 'highlight',
    getTarget: (input) => extractPartAlias(input),
    replyTemplate: (input) =>
      `Highlighting ${extractPartAlias(input) ?? 'component'}. Outline effect activated.`,
  },
]

// ─── 辅助函数 ──────────────────────────────────────────────────────────────

/** 从输入字符串中提取零件别名 */
function extractPartAlias(input: string): string | undefined {
  const lower = input.toLowerCase()
  for (const [alias, partId] of Object.entries(PART_ALIASES)) {
    if (lower.includes(alias.toLowerCase())) return partId
  }
  return undefined
}

// ─── 主解析函数 ────────────────────────────────────────────────────────────

/**
 * 将用户输入解析为 CommandAction
 * @param input 用户原始输入字符串
 * @returns CommandAction 结构体
 */
export function parse(input: string): CommandAction {
  const trimmed = input.trim()

  for (const rule of RULES) {
    const matched = rule.patterns.some((pattern) => pattern.test(trimmed))
    if (matched) {
      const target = rule.getTarget?.(trimmed)
      const replyText =
        typeof rule.replyTemplate === 'function'
          ? rule.replyTemplate(trimmed)
          : rule.replyTemplate

      return {
        type: rule.action,
        target,
        replyText,
      }
    }
  }

  // 未匹配任何规则
  return {
    type: 'unknown',
    replyText: `Command not recognized: "${trimmed}". Try: "explode", "inspect", "fly to pump", "show data", "cut section".`,
  }
}

/** 获取所有支持的指令示例（用于 UI 提示） */
export function getSuggestions(): string[] {
  return [
    'explode the engine',
    'collapse assembly',
    'reset view',
    'start inspection',
    'fly to impeller',
    'show temperature data',
    'cut section',
    'highlight pump body',
  ]
}
