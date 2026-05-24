import type { ComponentProps } from 'react'

export type IconName =
  | 'arrow-right'
  | 'bell'
  | 'braces'
  | 'check-circle'
  | 'chevron-left'
  | 'chevron-right'
  | 'clock'
  | 'copy'
  | 'edit'
  | 'email'
  | 'eye'
  | 'eye-off'
  | 'file-text'
  | 'help'
  | 'home'
  | 'info'
  | 'instagram'
  | 'lock'
  | 'lock-open'
  | 'log-out'
  | 'menu'
  | 'message-circle'
  | 'plus-circle'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'share'
  | 'star'
  | 'upload-cloud'
  | 'user'
  | 'youtube'
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

    case 'chevron-left':
      return (
        <svg {...sharedProps}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      )

    case 'clock':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )

    case 'copy':
      return (
        <svg {...sharedProps}>
          <rect height="12" rx="2" width="12" x="8" y="8" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
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

    case 'instagram':
      return (
        <svg {...sharedProps}>
          <rect height="18" rx="5" width="18" x="3" y="3" />
          <circle cx="12" cy="12" r="4" />
          <path d="M17.5 6.5h.01" />
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

    case 'send':
      return (
        <svg {...sharedProps}>
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
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

    case 'star':
      return (
        <svg {...sharedProps} fill="currentColor" stroke="none">
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.7 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5-4.8-4.7 6.6-.9Z" />
        </svg>
      )

    case 'upload-cloud':
      return (
        <svg {...sharedProps} fill="currentColor" stroke="none" viewBox="0 -960 960 960">
          <path d="M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H520q-33 0-56.5-23.5T440-240v-206l-64 62-56-56 160-160 160 160-56 56-64-62v206h220q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41h100v80H260Zm220-280Z" />
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

    case 'youtube':
      return (
        <svg {...sharedProps} fill="currentColor" stroke="none">
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9A28.2 28.2 0 0 0 2 12a28.2 28.2 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28.2 28.2 0 0 0 22 12a28.2 28.2 0 0 0-.4-4.8ZM10 15.3V8.7l5.8 3.3Z" />
        </svg>
      )
  }
}
