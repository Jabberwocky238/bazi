export function Footer() {
  const linkCls = 'text-amber-700 dark:text-amber-400 underline'
  return (
    <footer className="mt-10 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-wrap gap-x-4 gap-y-1">
      <span>
        释义来源 ·{' '}
        <a
          href="https://github.com/Jabberwocky238/bazi-skills"
          className={linkCls}
          target="_blank"
          rel="noreferrer"
        >
          bazi-skills
        </a>
      </span>
      <span>
        排盘计算 ·{' '}
        <a
          href="https://github.com/Jabberwocky238/bazi-engine"
          className={linkCls}
          target="_blank"
          rel="noreferrer"
        >
          bazi-engine
        </a>
      </span>
      <span>
        本项目 ·{' '}
        <a
          href="https://github.com/Jabberwocky238/ultimate-bazi"
          className={linkCls}
          target="_blank"
          rel="noreferrer"
        >
          ultimate-bazi
        </a>
      </span>
    </footer>
  )
}
