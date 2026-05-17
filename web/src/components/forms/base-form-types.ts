import type { FieldValues, Path, SubmitErrorHandler, SubmitHandler, UseFormReturn } from 'react-hook-form'

import type { IconName } from '../icons/icon'

export interface BaseFormOption {
  label: string
  value: string
}

export type BaseFormFieldKind = 'file' | 'select' | 'text' | 'textarea'

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
  options?: readonly BaseFormOption[]
  placeholder?: string
  span?: 'full' | 'half'
}

export interface BaseFormProps<TFormValues extends FieldValues> {
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
