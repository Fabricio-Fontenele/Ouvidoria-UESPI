import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form'

import { Icon } from './icon'
import type { IconName } from './icon'
import { cx } from '../utils/cx'

interface BaseFormOption {
  label: string
  value: string
}

type BaseFormFieldKind = 'file' | 'select' | 'text' | 'textarea'

export interface BaseFormField<TFormValues extends FieldValues> {
  accept?: string
  helper?: string
  inputType?: 'email' | 'tel' | 'text'
  kind: BaseFormFieldKind
  label: string
  maxFileSizeInBytes?: number
  maxFiles?: number
  multiple?: boolean
  name: Path<TFormValues>
  options?: BaseFormOption[]
  placeholder?: string
  span?: 'full' | 'half'
}

interface BaseFormProps<TFormValues extends FieldValues> {
  cancelHref: string
  cancelLabel?: string
  fields: BaseFormField<TFormValues>[]
  form: UseFormReturn<TFormValues>
  onInvalid?: SubmitErrorHandler<TFormValues>
  onSubmit: SubmitHandler<TFormValues>
  status?: 'error' | 'success' | null
  statusMessage?: string
  submitIcon?: IconName
  submitLabel: string
}

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

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB`
}

function getSelectedFiles(value: unknown) {
  if (typeof FileList !== 'undefined' && value instanceof FileList) {
    return Array.from(value)
  }

  if (Array.isArray(value) && value.every((item) => item instanceof File)) {
    return value
  }

  return []
}

function getFileLimitText(maxFiles: number) {
  return `Limite: até ${maxFiles} ${maxFiles === 1 ? 'arquivo' : 'arquivos'}.`
}

function getFileLimitError(maxFiles: number) {
  return `Anexe no máximo ${maxFiles} ${maxFiles === 1 ? 'arquivo' : 'arquivos'}.`
}

function getFileSizeLimitText(maxFileSizeInBytes: number) {
  return `Tamanho máximo por arquivo: ${formatFileSize(maxFileSizeInBytes)}.`
}

function getFileSizeLimitError(maxFileSizeInBytes: number) {
  return `Cada arquivo deve ter até ${formatFileSize(maxFileSizeInBytes)}.`
}

function hasOversizedFile(files: FileList | null, maxFileSizeInBytes: number | undefined) {
  return (
    files !== null &&
    maxFileSizeInBytes !== undefined &&
    Array.from(files).some((file) => file.size > maxFileSizeInBytes)
  )
}

function getFieldHelper<TFormValues extends FieldValues>(
  field: BaseFormField<TFormValues>,
  maxFiles: number,
  maxFileSizeInBytes: number | undefined,
) {
  if (field.kind !== 'file') {
    return field.helper
  }

  return [
    field.helper,
    getFileLimitText(maxFiles),
    maxFileSizeInBytes !== undefined ? getFileSizeLimitText(maxFileSizeInBytes) : undefined,
  ]
    .filter(Boolean)
    .join(' ')
}

function FilePreview({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  if (files.length === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-lg bg-landing-footer px-4 py-3">
      <p className="text-xs leading-5 font-black tracking-[0.08em] text-landing-blue uppercase">
        {files.length === 1 ? 'Arquivo anexado' : 'Arquivos anexados'}
      </p>
      <ul className="mt-2 space-y-2">
        {files.map((file) => (
          <li className="flex items-center gap-3 text-sm leading-5 text-landing-text" key={`${file.name}-${file.size}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-landing-surface text-landing-blue">
              <Icon className="size-4" name="file-text" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{file.name}</span>
              <span className="block text-xs leading-4 text-landing-brown">{formatFileSize(file.size)}</span>
            </span>
            <button
              aria-label={`Remover ${file.name}`}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-landing-surface text-landing-brown transition duration-150 hover:bg-landing-chip hover:text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
              onClick={() => onRemove(files.indexOf(file))}
              type="button"
            >
              <Icon className="size-4" name="x" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
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
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const values = form.watch()

  function handleRemoveFile(name: Path<TFormValues>, indexToRemove: number) {
    const input = fileInputRefs.current[name]

    if (input === null || input.files === null || typeof DataTransfer === 'undefined') {
      return
    }

    const nextFiles = new DataTransfer()

    Array.from(input.files).forEach((file, index) => {
      if (index !== indexToRemove) {
        nextFiles.items.add(file)
      }
    })

    input.files = nextFiles.files
    form.setValue(name, nextFiles.files as PathValue<TFormValues, Path<TFormValues>>, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    })
    form.clearErrors(name)
  }

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
        const maxFiles = field.kind === 'file' ? (field.maxFiles ?? 1) : 0
        const maxFileSizeInBytes = field.kind === 'file' ? field.maxFileSizeInBytes : undefined
        const error = getFieldError(form.formState.errors, field.name)
        const errorMessage = typeof error?.message === 'string' ? error.message : undefined
        const helper = getFieldHelper(field, maxFiles, maxFileSizeInBytes)
        const helperId = helper !== undefined && helper.length > 0 ? `${fieldId}-helper` : undefined
        const errorId = errorMessage !== undefined ? `${fieldId}-error` : undefined
        const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined
        const fieldContainerClassName = field.span === 'full' ? 'md:col-span-2' : undefined
        const selectedFiles = field.kind === 'file' ? getSelectedFiles(values[field.name]) : []
        const isFileLimitReached = field.kind === 'file' && selectedFiles.length >= maxFiles
        const fileRegistration =
          field.kind === 'file'
            ? form.register(field.name, {
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  const files = event.target.files

                  if (files !== null && files.length > maxFiles) {
                    event.target.value = ''
                    form.setValue(field.name, undefined as PathValue<TFormValues, Path<TFormValues>>, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: false,
                    })
                    form.setError(field.name, {
                      message: getFileLimitError(maxFiles),
                      type: 'maxFiles',
                    })

                    return
                  }

                  if (maxFileSizeInBytes !== undefined && hasOversizedFile(files, maxFileSizeInBytes)) {
                    event.target.value = ''
                    form.setValue(field.name, undefined as PathValue<TFormValues, Path<TFormValues>>, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: false,
                    })
                    form.setError(field.name, {
                      message: getFileSizeLimitError(maxFileSizeInBytes),
                      type: 'maxFileSize',
                    })

                    return
                  }

                  form.clearErrors(field.name)
                },
              })
            : undefined

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
                <label
                  className={cx(
                    'flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-landing-muted-surface px-4 py-5 text-center text-sm leading-5 text-landing-brown transition duration-150 hover:border-landing-blue focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-landing-blue',
                    errorMessage !== undefined ? 'border-red-700' : 'border-landing-chip',
                    isFileLimitReached && 'cursor-not-allowed opacity-65 hover:border-landing-chip',
                  )}
                  htmlFor={fieldId}
                >
                  <Icon className="mb-2 size-6 text-landing-blue" name="file-text" />
                  {isFileLimitReached
                    ? 'Limite de anexos atingido'
                    : (field.placeholder ?? 'Clique para anexar arquivos')}
                  <input
                    accept={field.accept}
                    aria-describedby={describedBy}
                    aria-invalid={errorMessage !== undefined}
                    className="sr-only"
                    disabled={isFileLimitReached}
                    id={fieldId}
                    multiple={maxFiles > 1 && field.multiple !== false}
                    type="file"
                    {...fileRegistration}
                    ref={(element) => {
                      fileInputRefs.current[field.name] = element
                      fileRegistration?.ref(element)
                    }}
                  />
                </label>
              ) : null}
            </div>
            {field.kind === 'file' ? (
              <FilePreview files={selectedFiles} onRemove={(index) => handleRemoveFile(field.name, index)} />
            ) : null}
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
