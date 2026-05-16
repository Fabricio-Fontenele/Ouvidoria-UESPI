import type { ComponentProps } from 'react'

export type IconName =
  | 'arrow-right'
  | 'bell'
  | 'chevron-right'
  | 'email'
  | 'eye'
  | 'eye-off'
  | 'help'
  | 'info'
  | 'lock'
  | 'menu'
  | 'search'
  | 'share'
  | 'user'

interface IconProps extends ComponentProps<'svg'> {
  name: IconName
}

export function Icon({ className, name, ...props }: IconProps) {
  const sharedProps = {
    ...props,
    'aria-hidden': props['aria-hidden'] ?? true,
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  switch (name) {
    case 'arrow-right':
      return (
        <svg {...sharedProps}>
          <path d="M5 12h12" />
          <path d="m13 6 6 6-6 6" />
          <path d="M19 5v14" />
        </svg>
      )

    case 'bell':
      return (
        <svg {...sharedProps}>
          <path d="M10 21h4" />
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        </svg>
      )

    case 'chevron-right':
      return (
        <svg {...sharedProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      )

    case 'email':
      return (
        <svg {...sharedProps}>
          <rect height="14" rx="2" width="18" x="3" y="5" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      )

    case 'eye':
      return (
        <svg {...sharedProps}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      )

    case 'eye-off':
      return (
        <svg {...sharedProps}>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6A2.4 2.4 0 0 0 12 14.4c.7 0 1.3-.3 1.7-.7" />
          <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.2" />
          <path d="M6.6 6.7A17.4 17.4 0 0 0 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.2" />
        </svg>
      )

    case 'help':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.5 9a2.7 2.7 0 0 1 5.1 1.3c0 1.8-2.6 2.2-2.6 4" />
          <path d="M12 17.5h.01" />
        </svg>
      )

    case 'info':
      return (
        <svg {...sharedProps}>
          <path d="M12 7v7" />
          <path d="M12 17h.01" />
        </svg>
      )

    case 'lock':
      return (
        <svg {...sharedProps}>
          <rect height="11" rx="2" width="14" x="5" y="10" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      )

    case 'menu':
      return (
        <svg {...sharedProps}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      )

    case 'search':
      return (
        <svg {...sharedProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )

    case 'share':
      return (
        <svg {...sharedProps}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 10.5 6.8-4" />
          <path d="m8.6 13.5 6.8 4" />
        </svg>
      )

    case 'user':
      return (
        <svg {...sharedProps}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
  }
}
