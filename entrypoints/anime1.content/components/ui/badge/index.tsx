import type { VariantProps } from 'class-variance-authority'

import type { FC, PropsWithChildren } from 'react'
import { cn } from '@/libs/utils'
import { cva } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-(--primary) text-(--text-white) [a&]:hover:bg-(--primary)/90',
        secondary:
          'border-transparent bg-(--secondary) text-(--text-white) [a&]:hover:bg-(--secondary)/90',
        orange: 'border-transparent bg-orange-400 text-(--text-white) [a&]:hover:bg-orange-400/90',
        // 这些颜色在 dark 模式下会变成更深的颜色
        teal: 'border-transparent bg-teal-400 text-(--text-white) [a&]:hover:bg-teal-400/90 dark:bg-teal-600 [a&]:hover:bg-teal-600/90',
        lime: 'border-transparent bg-lime-400 text-(--text-white) [a&]:hover:bg-lime-400/90 dark:bg-lime-600 [a&]:hover:bg-lime-600/90',
        slate: 'border-transparent bg-slate-400 text-(--text-white) [a&]:hover:bg-slate-400/90 dark:bg-slate-600 [a&]:hover:bg-slate-600/90',
        purple: 'border-transparent bg-purple-400 text-(--text-white) [a&]:hover:bg-purple-400/90 dark:bg-purple-600 [a&]:hover:bg-purple-600/90',
        amber: 'border-transparent bg-amber-400 text-(--text-white) [a&]:hover:bg-amber-400/90 dark:bg-amber-600 [a&]:hover:bg-amber-600/90',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
)

const Badge: FC<PropsWithChildren<VariantProps<typeof badgeVariants> & { className?: string }>> = ({ children, className, variant }) => {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
    >
      {children}
    </span>
  )
}

export default Badge
