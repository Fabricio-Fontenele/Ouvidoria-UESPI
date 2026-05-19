import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form'

import type { BaseFormField } from './base-form-types'
import { formatFileSize, getFileLimitError, getFileSizeLimitError, hasOversizedFile } from './form-file-utils'
import { Icon } from '../icons/icon'
import { cx } from '../../utils/cx'

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
        {files.map((file, index) => (
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
              onClick={() => onRemove(index)}
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

export function FormFileField<TFormValues extends FieldValues>({
  describedBy,
  errorMessage,
  field,
  fieldId,
  form,
  selectedFiles,
}: {
  describedBy?: string
  errorMessage?: string
  field: BaseFormField<TFormValues>
  fieldId: string
  form: UseFormReturn<TFormValues>
  selectedFiles: File[]
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const maxFiles = field.maxFiles ?? 1
  const maxFileSizeInBytes = field.maxFileSizeInBytes
  const isFileLimitReached = selectedFiles.length >= maxFiles

  function setFieldFiles(files: FileList | undefined) {
    form.setValue(field.name, files as PathValue<TFormValues, Path<TFormValues>>, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    })
  }

  function handleRemoveFile(indexToRemove: number) {
    const input = inputRef.current

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
    setFieldFiles(nextFiles.files)
    form.clearErrors(field.name)
  }

  const fileRegistration = form.register(field.name, {
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files

      if (files !== null && files.length > maxFiles) {
        event.target.value = ''
        setFieldFiles(undefined)
        form.setError(field.name, {
          message: getFileLimitError(maxFiles),
          type: 'maxFiles',
        })

        return
      }

      if (maxFileSizeInBytes !== undefined && hasOversizedFile(files, maxFileSizeInBytes)) {
        event.target.value = ''
        setFieldFiles(undefined)
        form.setError(field.name, {
          message: getFileSizeLimitError(maxFileSizeInBytes),
          type: 'maxFileSize',
        })

        return
      }

      form.clearErrors(field.name)
    },
  })

  return (
    <>
      <label
        className={cx(
          'flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-landing-muted-surface px-4 py-5 text-center text-sm leading-5 text-landing-brown transition duration-150 hover:border-landing-blue focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-landing-blue',
          errorMessage !== undefined ? 'border-red-700' : 'border-landing-chip',
          isFileLimitReached && 'cursor-not-allowed opacity-65 hover:border-landing-chip',
        )}
        htmlFor={fieldId}
      >
        <Icon className="mb-2 size-6 text-landing-blue" name="file-text" />
        {isFileLimitReached ? 'Limite de anexos atingido' : (field.placeholder ?? 'Clique para anexar arquivos')}
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
            inputRef.current = element
            fileRegistration.ref(element)
          }}
        />
      </label>
      <FilePreview files={selectedFiles} onRemove={handleRemoveFile} />
    </>
  )
}
