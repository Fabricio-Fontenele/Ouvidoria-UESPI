import type { ComponentProps } from 'react'

export type IconName =
  | 'arrow-right'
  | 'bell'
  | 'braces'
  | 'check-circle'
  | 'chevron-right'
  | 'edit'
  | 'email'
  | 'eye'
  | 'eye-off'
  | 'file-text'
  | 'help'
  | 'home'
  | 'info'
  | 'lock'
  | 'lock-open'
  | 'log-out'
  | 'menu'
  | 'message-circle'
  | 'plus-circle'
  | 'search'
  | 'settings'
  | 'shield'
  | 'share'
  | 'user'
  | 'x'

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

    case 'braces':
      return (
        <svg {...sharedProps}>
          <path d="M8 3c-2 0-3 1-3 3v2c0 1.4-.8 2-2 2 1.2 0 2 .6 2 2v2c0 2 1 3 3 3" />
          <path d="M16 3c2 0 3 1 3 3v2c0 1.4.8 2 2 2-1.2 0-2 .6-2 2v2c0 2-1 3-3 3" />
        </svg>
      )

    case 'check-circle':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      )

    case 'chevron-right':
      return (
        <svg {...sharedProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      )

    case 'edit':
      return (
        <svg {...sharedProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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

    case 'file-text':
      return (
        <svg {...sharedProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
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

    case 'home':
      return (
        <svg {...sharedProps}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
          <path d="M9 21v-6h6v6" />
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

    case 'lock-open':
      return (
        <svg {...sharedProps}>
          <rect height="10" rx="2" width="14" x="5" y="11" />
          <path d="M8 11V8a4 4 0 0 1 7.5-2" />
          <path d="M12 15v2" />
        </svg>
      )

    case 'log-out':
      return (
        <svg {...sharedProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
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

    case 'message-circle':
      return (
        <svg {...sharedProps}>
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.8-4.8A8.4 8.4 0 1 1 21 11.5Z" />
          <path d="M8 11h.01" />
          <path d="M12 11h.01" />
          <path d="M16 11h.01" />
        </svg>
      )

    case 'plus-circle':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      )

    case 'search':
      return (
        <svg {...sharedProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )

    case 'settings':
      return (
        <svg {...sharedProps}>
          <path d="M12.2 2h-.4a2 2 0 0 0-2 2 1.6 1.6 0 0 1-2.4 1.4 2 2 0 0 0-2.7.7l-.2.3a2 2 0 0 0 .7 2.7 1.6 1.6 0 0 1 0 2.8 2 2 0 0 0-.7 2.7l.2.3a2 2 0 0 0 2.7.7 1.6 1.6 0 0 1 2.4 1.4 2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2 1.6 1.6 0 0 1 2.4-1.4 2 2 0 0 0 2.7-.7l.2-.3a2 2 0 0 0-.7-2.7 1.6 1.6 0 0 1 0-2.8 2 2 0 0 0 .7-2.7l-.2-.3a2 2 0 0 0-2.7-.7 1.6 1.6 0 0 1-2.4-1.4 2 2 0 0 0-2-2Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )

    case 'shield':
      return (
        <svg {...sharedProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
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

    case 'x':
      return (
        <svg {...sharedProps}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
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
