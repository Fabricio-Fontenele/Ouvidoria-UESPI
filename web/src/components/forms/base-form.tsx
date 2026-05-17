import type { FieldError, FieldErrors, FieldValues, Path } from 'react-hook-form'

import type { BaseFormField, BaseFormProps } from './base-form-types'
import { FormFileField } from './form-file-field'
import { getFileLimitText, getFileSizeLimitText, getSelectedFiles } from './form-file-utils'
import { Icon } from '../icons/icon'
import { cx } from '../../utils/cx'

export type { BaseFormField } from './base-form-types'

function inputClasses(hasError: boolean, className?: string) {
  return cx(
    'w-full rounded-lg bg-landing-muted-surface px-4 py-3 text-sm leading-5 text-landing-text outline-landing-blue transition duration-150 placeholder:text-landing-menu focus-visible:outline-2 focus-visible:outline-offset-2',
    hasError && 'outline-2 outline-offset-2 outline-red-700',
    className,
  )
}

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

function FormMessage({ children, id, variant }: { children: string; id?: string; variant: 'error' | 'helper' }) {
  return (
    <p
      className={cx('mt-1 text-xs leading-5', variant === 'error' ? 'font-bold text-red-700' : 'text-landing-brown')}
      id={id}
    >
      {children}
    </p>
  )
}

function getFieldHelper<TFormValues extends FieldValues>(field: BaseFormField<TFormValues>) {
  if (field.kind !== 'file') {
    return field.helper
  }

  const maxFiles = field.maxFiles ?? 1

  return [
    field.helper,
    getFileLimitText(maxFiles),
    field.maxFileSizeInBytes !== undefined ? getFileSizeLimitText(field.maxFileSizeInBytes) : undefined,
  ]
    .filter(Boolean)
    .join(' ')
}

export function BaseForm<TFormValues extends FieldValues>({
  cancelHref,
  cancelLabel = 'Voltar',
  fields,
  form,
  onInvalid,
  onSubmit,
  status = null,
  statusMessage,
  submitIcon = 'send',
  submitLabel,
}: BaseFormProps<TFormValues>) {
  const hasSubmitErrors = form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0
  const values = form.watch()

  return (
    <form
      className="mt-8 grid gap-6 rounded-lg border border-landing-chip bg-landing-surface p-5 shadow-landing-step md:grid-cols-2 md:p-7"
      noValidate
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
    >
      {status !== null && statusMessage !== undefined ? (
        <div
          className={cx(
            'rounded-lg px-4 py-3 text-sm leading-6 font-bold md:col-span-2',
            status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800',
          )}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {statusMessage}
        </div>
      ) : null}

      {hasSubmitErrors ? (
        <div
          className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800 md:col-span-2"
          role="alert"
        >
          Revise os campos destacados antes de enviar a manifestação.
        </div>
      ) : null}

      {fields.map((field) => {
        const fieldId = `field-${field.name}`
        const error = getFieldError(form.formState.errors, field.name)
        const errorMessage = typeof error?.message === 'string' ? error.message : undefined
        const helper = getFieldHelper(field)
        const helperId = helper !== undefined && helper.length > 0 ? `${fieldId}-helper` : undefined
        const errorId = errorMessage !== undefined ? `${fieldId}-error` : undefined
        const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined
        const fieldContainerClassName = field.span === 'full' ? 'md:col-span-2' : undefined
        const selectedFiles = field.kind === 'file' ? getSelectedFiles(values[field.name]) : []

        return (
          <div className={fieldContainerClassName} key={field.name}>
            <label className="block text-sm leading-5 font-bold text-landing-text" htmlFor={fieldId}>
              {field.label}
            </label>
            {helper !== undefined && helper.length > 0 ? (
              <FormMessage id={helperId} variant="helper">
                {helper}
              </FormMessage>
            ) : null}
            <div className="mt-2">
              {field.kind === 'select' ? (
                <select
                  aria-describedby={describedBy}
                  aria-invalid={errorMessage !== undefined}
                  className={inputClasses(errorMessage !== undefined)}
                  id={fieldId}
                  {...form.register(field.name)}
                >
                  <option value="">Selecione uma opção</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {field.kind === 'text' ? (
                <input
                  aria-describedby={describedBy}
                  aria-invalid={errorMessage !== undefined}
                  className={inputClasses(errorMessage !== undefined)}
                  id={fieldId}
                  placeholder={field.placeholder}
                  type={field.inputType ?? 'text'}
                  {...form.register(field.name)}
                />
              ) : null}

              {field.kind === 'textarea' ? (
                <textarea
                  aria-describedby={describedBy}
                  aria-invalid={errorMessage !== undefined}
                  className={inputClasses(errorMessage !== undefined, 'min-h-40 resize-y')}
                  id={fieldId}
                  placeholder={field.placeholder}
                  {...form.register(field.name)}
                />
              ) : null}

              {field.kind === 'file' ? (
                <FormFileField
                  describedBy={describedBy}
                  errorMessage={errorMessage}
                  field={field}
                  fieldId={fieldId}
                  form={form}
                  selectedFiles={selectedFiles}
                />
              ) : null}
            </div>
            {errorMessage !== undefined ? (
              <FormMessage id={errorId} variant="error">
                {errorMessage}
              </FormMessage>
            ) : null}
          </div>
        )
      })}

      <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-landing-blue px-5 text-sm leading-5 font-bold text-landing-blue no-underline transition duration-150 hover:bg-landing-blue/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
          href={cancelHref}
        >
          {cancelLabel}
        </a>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-landing-blue px-5 text-sm leading-5 font-bold text-white transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue disabled:cursor-not-allowed disabled:opacity-70"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting ? 'Enviando...' : submitLabel}
          <Icon className="size-4" name={submitIcon} />
        </button>
      </div>
    </form>
  )
}
