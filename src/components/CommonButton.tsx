import type { ButtonHTMLAttributes, ReactNode, ElementType } from 'react'

interface CommonButtonProps<E extends ElementType = 'button'> {
  as?: ElementType
  variant?: 'primary' | 'secondary' | 'danger'
  width?: string
  children: ReactNode
}

const baseStyles =
  'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold ' +
  'shadow-sm transition active:scale-[0.99]'

const variantStyles = {
  primary: 'bg-amber-700 text-white hover:bg-amber-600',
  secondary:
    'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-100 ' +
    'border border-slate-300 dark:border-slate-700 ' +
    'hover:border-amber-600 dark:hover:border-amber-400',
  danger:
    'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 ' +
    'border border-slate-300 dark:border-slate-700 ' +
    'hover:text-red-600 hover:border-red-400 dark:hover:border-red-500',
}

export function CommonButton({
  as: As = 'button',
  variant = 'secondary',
  width,
  className = '',
  children,
  ...props
}: CommonButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styleClasses = [
    baseStyles,
    variantStyles[variant],
    width || '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <As className={styleClasses} {...props}>
      {children}
    </As>
  )
}
