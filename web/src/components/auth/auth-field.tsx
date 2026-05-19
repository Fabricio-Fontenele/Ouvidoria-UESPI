import { useState, type ComponentProps } from 'react'

import { cx } from '../../utils/cx'
import { Icon, type IconName } from '../icons/icon'

interface AuthFieldProps extends Omit<ComponentProps<'input'>, 'className' | 'type'> {
  containerClassName?: string
  icon: IconName
  inputClassName?: string
  isLabelStrong?: boolean
  label: string
  type: 'email' | 'password' | 'text'
}

export function AuthField({
  containerClassName,
  icon,
  id,
  inputClassName,
  isLabelStrong = true,
  label,
  type,
  ...inputProps
}: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const canTogglePassword = type === 'password'
  const resolvedType = canTogglePassword && isPasswordVisible ? 'text' : type

  const labelClasses = cx('mb-3 block text-sm leading-5 text-login-text', isLabelStrong ? 'font-bold' : 'font-normal')

  return (
    <div className={containerClassName}>
      <label className={labelClasses} htmlFor={id}>
        {label}
      </label>

      <div className="grid h-12 grid-cols-[24px_1fr_32px] items-center gap-2.5 rounded-lg bg-login-field py-0 pr-4 pl-5 text-login-icon outline-login-blue focus-within:outline-2 focus-within:outline-offset-2 min-[361px]:pl-7 md:h-13 md:grid-cols-[28px_1fr_36px] md:px-7">
        <Icon className="size-[17px] md:size-[18px]" name={icon} />
        <input
          className={cx(
            'min-w-0 bg-transparent text-base text-login-brown outline-none placeholder:text-login-brown/40 md:text-[17px]',
            inputClassName,
          )}
          id={id}
          type={resolvedType}
          {...inputProps}
        />

        {canTogglePassword ? (
          <button
            aria-label={isPasswordVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
            className="grid size-8 cursor-pointer place-items-center rounded-full text-login-icon transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue"
            onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
            type="button"
          >
            <Icon className="size-[19px]" name={isPasswordVisible ? 'eye-off' : 'eye'} />
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
