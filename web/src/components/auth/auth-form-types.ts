import type { FieldValues, Path, SubmitErrorHandler, SubmitHandler, UseFormReturn } from 'react-hook-form'
import type { ReactNode } from 'react'

import type { IconName } from '../icons/icon'

export interface AuthFormField<TFormValues extends FieldValues> {
  autoComplete?: string
  icon: IconName
  inputType: 'email' | 'password' | 'text'
  isLabelStrong?: boolean
  label: string
  name: Path<TFormValues>
  placeholder?: string
}

export interface AuthFormProps<TFormValues extends FieldValues> {
  children?: ReactNode
  className: string
  fields: AuthFormField<TFormValues>[]
  form: UseFormReturn<TFormValues>
  onInvalid?: SubmitErrorHandler<TFormValues>
  onSubmit: SubmitHandler<TFormValues>
  status?: 'error' | 'success' | null
  statusMessage?: string
  submitIcon?: IconName
  submitLabel: string
  submittingLabel?: string
}
