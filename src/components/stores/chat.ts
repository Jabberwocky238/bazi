import { create } from 'zustand'

// ————————————————————————————————————————————————————————
// chat 面板的开关状态 —— 独立于 ChatWidget 内部消息逻辑。
// AppBar 右侧按钮 toggle, ChatWidget 读 chatOpen 决定面板显隐。
// ————————————————————————————————————————————————————————

interface ChatState {
  chatOpen: boolean
  setChatOpen: (v: boolean) => void
  toggleChat: () => void
}

export const useChat = create<ChatState>((set) => ({
  chatOpen: false,
  setChatOpen: (v) => set({ chatOpen: v }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
}))
