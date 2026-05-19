import type { FieldError, FieldErrors, FieldValues, Path } from 'react-hook-form'

import type { AuthFormProps } from './auth-form-types'
import { AuthField } from './auth-field'
import { Icon } from '../icons/icon'
import { cx } from '../../utils/cx'

export type { AuthFormField } from './auth-form-types'

function getFieldError<TFormValues extends FieldValues>(
  errors: FieldErrors<TFormValues>,
  name: Path<TFormValues>,
): FieldError | undefined {
  const error = errors[name]

  if (error === undefined || !('message' in error)) {
    return undefined
  }

  return error as FieldError
}

export function AuthFormMessage({
  children,
  id,
  variant,
}: {
  children?: string
  id?: string
  variant: 'error' | 'success'
}) {
  if (children === undefined) {
    return null
  }

  return (
    <p
      className={cx(
        'text-sm leading-5 font-bold',
        variant === 'error' ? 'text-red-700' : 'text-green-700',
        id !== undefined && 'mt-2',
      )}
      id={id}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}

export function AuthForm<TFormValues extends FieldValues>({
  children,
  className,
  fields,
  form,
  onInvalid,
  onSubmit,
  status = null,
  statusMessage,
  submitIcon,
  submitLabel,
  submittingLabel = 'Enviando...',
}: AuthFormProps<TFormValues>) {
  return (
    <form className={className} noValidate onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
      {fields.map((field) => {
        const fieldId = `auth-${field.name}`
        const error = getFieldError(form.formState.errors, field.name)
        const errorMessage = typeof error?.message === 'string' ? error.message : undefined
        const errorId = errorMessage === undefined ? undefined : `${fieldId}-error`

        return (
          <div key={field.name}>
            <AuthField
              aria-describedby={errorId}
              aria-invalid={errorMessage === undefined ? undefined : true}
              autoComplete={field.autoComplete}
              icon={field.icon}
              id={fieldId}
              isLabelStrong={field.isLabelStrong}
              label={field.label}
              placeholder={field.placeholder}
              required
              type={field.inputType}
              {...form.register(field.name)}
            />
            <AuthFormMessage id={errorId} variant="error">
              {errorMessage}
            </AuthFormMessage>
          </div>
        )
      })}

      {children}

      <button
        className="mt-[22px] inline-flex min-h-[48px] w-56 cursor-pointer items-center justify-center gap-1 self-center justify-self-center rounded-lg bg-login-blue text-lg leading-7 font-bold text-login-on-blue transition duration-150 hover:opacity-85 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2 md:mt-4 md:w-64"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting ? submittingLabel : submitLabel}
        {submitIcon !== undefined ? <Icon className="size-[18px]" name={submitIcon} /> : null}
      </button>

      {status !== null && statusMessage !== undefined ? (
        <div className="text-center md:col-span-2">
          <AuthFormMessage variant={status}>{statusMessage}</AuthFormMessage>
        </div>
      ) : null}
    </form>
  )
}
