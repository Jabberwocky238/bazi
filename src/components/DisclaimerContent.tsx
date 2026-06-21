import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import disclaimerMd from '@/assets/disclaimer.md?raw'

// ————————————————————————————————————————————————————————
// 免责声明 —— 仅正文 (Markdown 渲染)。
// 不自带受控 Modal 外壳, 由调用方通过 useDialog().open() 命令式打开
// (与其它浮层统一走 DialogProvider 的位置通道), 内嵌 <Modal> 即可。
// ————————————————————————————————————————————————————————

export function DisclaimerContent() {
  return (
    <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
      <Markdown remarkPlugins={[remarkGfm]}>{disclaimerMd}</Markdown>
    </div>
  )
}
