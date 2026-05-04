import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import disclaimerMd from '@/assets/disclaimer.md?raw'
import { Dialog } from '@@/Dialog'

export function DisclaimerDialog({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="免责声明">
      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
        <Markdown remarkPlugins={[remarkGfm]}>{disclaimerMd}</Markdown>
      </div>
    </Dialog>
  )
}
