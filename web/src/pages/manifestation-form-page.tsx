import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import type { FieldError, FieldErrors, Path, SubmitErrorHandler, SubmitHandler, UseFormRegisterReturn } from 'react-hook-form'
import { useForm, useWatch } from 'react-hook-form'

import {
  getSearchParams,
  normalizeProtocol,
  routes,
} from '../app/routes'
import {
  getManifestationFormDefaultValues,
  manifestationAreas,
  manifestationFormSchema,
  manifestationIdentificationOptions,
  manifestationTypes,
} from '../application/manifestations/manifestation-form-contract'
import type { ManifestationFormData } from '../application/manifestations/manifestation-form-contract'
import guaraMascot from '../assets/guara-mascot.png'
import { Icon } from '../components/icons/icon'
import { AuthenticatedAppShell } from '../components/layout/authenticated-app-shell'
import { SiteFooter } from '../components/layout/site-footer'
import { ManifestationSubmissionSuccess } from '../components/manifestations/manifestation-submission-success'
import { cx } from '../utils/cx'

type ManifestationFormMode = 'create' | 'edit'

interface ManifestationFormState {
  protocol: string | null
  mode: ManifestationFormMode
}

interface FieldMessageProps {
  children: string
  id?: string
  variant: 'error' | 'hint'
}

interface FieldChromeProps {
  children: React.ReactNode
  errorMessage?: string
  hint?: string
  id: string
  label: string
}

const mockSubmissionProtocol = '#UESPI-2026-0892-ABC'

function resolveFormState(): ManifestationFormState {
  const searchParams = getSearchParams()
  const protocol = searchParams.get('protocol')

  if (protocol !== null && protocol.trim() !== '') {
    return {
      mode: 'edit',
      protocol: normalizeProtocol(protocol),
    }
  }

  return {
    mode: 'create',
    protocol: null,
  }
}

function getFieldError(errors: FieldErrors<ManifestationFormData>, name: Path<ManifestationFormData>) {
  const error = errors[name]

  if (error === undefined || !('message' in error)) {
    return undefined
  }

  return error as FieldError
}

function FieldMessage({ children, id, variant }: FieldMessageProps) {
  return (
    <p
      className={cx(
        'mt-1 text-xs leading-5',
        variant === 'error' ? 'font-bold text-[#ba1a1a]' : 'text-[#5b403d]',
      )}
      id={id}
    >
      {children}
    </p>
  )
}

function FieldChrome({ children, errorMessage, hint, id, label }: FieldChromeProps) {
  const hintId = hint !== undefined ? `${id}-hint` : undefined
  const errorId = errorMessage !== undefined ? `${id}-error` : undefined

  return (
    <div className="space-y-2">
      <label className="block text-sm leading-5 text-[#1d1b1b]" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint !== undefined ? (
        <FieldMessage id={hintId} variant="hint">
          {hint}
        </FieldMessage>
      ) : null}
      {errorMessage !== undefined ? (
        <FieldMessage id={errorId} variant="error">
          {errorMessage}
        </FieldMessage>
      ) : null}
    </div>
  )
}

function inputClassName(hasError: boolean, extraClassName?: string) {
  return cx(
    'w-full rounded-lg border bg-white px-4 text-base leading-6 text-[#43474e] transition duration-150 placeholder:text-[#72777f]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d47a1]',
    hasError ? 'border-[#ba1a1a]' : 'border-[rgba(114,119,127,0.3)]',
    extraClassName,
  )
}

function SelectField({
  errorMessage,
  id,
  label,
  options,
  registration,
}: {
  errorMessage?: string
  id: string
  label: string
  options: readonly string[]
  registration: UseFormRegisterReturn
}) {
  const describedBy = errorMessage !== undefined ? `${id}-error` : undefined

  return (
    <FieldChrome errorMessage={errorMessage} id={id} label={label}>
      <select
        aria-describedby={describedBy}
        aria-invalid={errorMessage !== undefined}
        className={inputClassName(errorMessage !== undefined, 'h-12 appearance-auto py-0')}
        id={id}
        {...registration}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldChrome>
  )
}

function TextInputField({
  errorMessage,
  id,
  label,
  placeholder,
  registration,
}: {
  errorMessage?: string
  id: string
  label: string
  placeholder: string
  registration: UseFormRegisterReturn
}) {
  const describedBy = errorMessage !== undefined ? `${id}-error` : undefined

  return (
    <FieldChrome errorMessage={errorMessage} id={id} label={label}>
      <input
        aria-describedby={describedBy}
        aria-invalid={errorMessage !== undefined}
        className={inputClassName(errorMessage !== undefined, 'h-12')}
        id={id}
        placeholder={placeholder}
        type="text"
        {...registration}
      />
    </FieldChrome>
  )
}

function TextareaField({
  errorMessage,
  id,
  label,
  placeholder,
  registration,
}: {
  errorMessage?: string
  id: string
  label: string
  placeholder: string
  registration: UseFormRegisterReturn
}) {
  const describedBy = errorMessage !== undefined ? `${id}-error` : undefined

  return (
    <FieldChrome errorMessage={errorMessage} id={id} label={label}>
      <textarea
        aria-describedby={describedBy}
        aria-invalid={errorMessage !== undefined}
        className={inputClassName(errorMessage !== undefined, 'min-h-40 resize-y py-4')}
        id={id}
        placeholder={placeholder}
        {...registration}
      />
    </FieldChrome>
  )
}

function PrivacyOption({
  checked,
  description,
  label,
  value,
  ...props
}: React.ComponentProps<'input'> & {
  checked: boolean
  description: string
  label: string
  value: string
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg p-1 transition duration-150 hover:bg-white/70">
      <span className="relative mt-1 grid size-5 shrink-0 place-items-center">
        <input
          checked={checked}
          className="peer size-4 appearance-none rounded-full border border-[rgba(114,119,127,0.3)] bg-white transition duration-150 checked:border-[#0d47a1] checked:bg-[#0d47a1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d47a1]"
          type="radio"
          value={value}
          {...props}
        />
        <span className="pointer-events-none absolute size-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
      </span>
      <span>
        <span className="block text-sm leading-5 font-bold text-[#1d1b1b]">{label}</span>
        <span className="mt-0.5 block text-xs leading-[19px] text-[#43474e]">{description}</span>
      </span>
    </label>
  )
}

function SectionHeading({ icon, title }: { icon: 'file-text' | 'shield' | 'upload-cloud'; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm leading-5 font-bold tracking-[0.035em] text-[#0d47a1] uppercase">
      <Icon className="size-4" name={icon} />
      {title}
    </h2>
  )
}

export function ManifestationFormPage() {
  const { mode } = resolveFormState()
  const isEditing = mode === 'edit'
  const formId = useId()
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null)
  const [status, setStatus] = useState<'error' | 'success' | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | undefined>()
  const form = useForm<ManifestationFormData>({
    defaultValues: getManifestationFormDefaultValues(isEditing),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(manifestationFormSchema),
  })
  const selectedIdentification = useWatch({ control: form.control, name: 'identification' })
  const selectedFiles = useWatch({ control: form.control, name: 'attachments' })
  const files = selectedFiles !== undefined ? Array.from(selectedFiles) : []
  const hasSubmitErrors = form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0
  const typeError = getFieldError(form.formState.errors, 'manifestationType')?.message
  const areaError = getFieldError(form.formState.errors, 'area')?.message
  const involvedPeopleError = getFieldError(form.formState.errors, 'involvedPeople')?.message
  const descriptionError = getFieldError(form.formState.errors, 'description')?.message
  const identificationError = getFieldError(form.formState.errors, 'identification')?.message
  const attachmentsError = getFieldError(form.formState.errors, 'attachments')?.message
  const handleInvalidSubmit: SubmitErrorHandler<ManifestationFormData> = () => {
    setSubmittedProtocol(null)
    setStatus('error')
    setStatusMessage('Não foi possível enviar. Corrija os campos indicados e tente novamente.')
  }

  const handleSubmit: SubmitHandler<ManifestationFormData> = () => {
    if (!isEditing) {
      setSubmittedProtocol(mockSubmissionProtocol)
      setStatus(null)
      setStatusMessage(undefined)
      return
    }

    setStatus('success')
    setStatusMessage(
      isEditing
        ? 'Alterações preparadas com sucesso. A integração com o backend poderá enviar estes dados.'
        : 'Manifestação preparada com sucesso. A integração com o backend poderá registrar estes dados.',
    )
  }

  if (submittedProtocol !== null) {
    return <ManifestationSubmissionSuccess protocol={submittedProtocol} />
  }

  return (
    <div className="min-h-svh bg-white font-sans text-[#1d1b1b]">
      <AuthenticatedAppShell fixedHeader>
        <main className="mx-auto w-full max-w-5xl px-5 pt-7 pb-12 min-[390px]:px-7 sm:px-8 lg:px-10">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start lg:gap-12">
            <div className="lg:sticky lg:top-28">
              <div className="border-l-4 border-[#0d47a1] pl-4">
                <h1 className="max-w-xs text-4xl leading-10 font-bold tracking-[-0.025em] text-[#1d1b1b] sm:max-w-md sm:text-5xl sm:leading-[1.08]">
                  {isEditing ? 'Editar Manifestação' : 'Registrar Manifestação'}
                </h1>
                <p className="mt-6 max-w-sm text-lg leading-[29px] text-[#43474e]">
                  {isEditing
                    ? 'Revise as informações do chamado antes de enviar uma atualização para a Ouvidoria.'
                    : 'Sua voz é fundamental para a construção de uma UESPI melhor. Preencha os campos abaixo com clareza para que possamos encaminhar seu chamado com eficiência.'}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-[1fr_auto] items-center gap-4">
                <div>
                  <h2 className="text-xl leading-7 font-bold text-[#ba1a1a]">Preencha com o Guará!</h2>
                  <p className="mt-3 text-sm leading-5 text-[#5b403d]">
                    Precisa de ajuda para registrar uma nova manifestação? Clique no ícone do Guará para obter ajuda.
                  </p>
                </div>
                <a
                  aria-label="Abrir ajuda do Guará"
                  className="block size-20 shrink-0 rounded-full drop-shadow-home-mascot transition duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d47a1] sm:size-24"
                  href={routes.guara}
                >
                  <img alt="" className="size-full rounded-full object-contain" src={guaraMascot} />
                </a>
              </div>
            </div>

            <form className="space-y-8" noValidate onSubmit={form.handleSubmit(handleSubmit, handleInvalidSubmit)}>
              <section className="rounded-lg border border-[#ebebeb] bg-[#f7f7f8] p-6" aria-labelledby="privacy-title">
                <SectionHeading icon="shield" title="Configurações de sigilo" />
                <div className="mt-4 space-y-3">
                  {manifestationIdentificationOptions.map((option) => (
                    <PrivacyOption
                      checked={selectedIdentification === option.value}
                      description={
                        option.value === 'identified'
                          ? 'Seus dados serão visíveis para a equipe de ouvidoria.'
                          : 'Nenhum dado pessoal será vinculado à manifestação.'
                      }
                      id={`${formId}-${option.value}`}
                      key={option.value}
                      label={option.value === 'identified' ? 'Identificado' : 'Anônimo'}
                      value={option.value}
                      {...form.register('identification')}
                    />
                  ))}
                </div>
                {identificationError !== undefined ? (
                  <FieldMessage id={`${formId}-identification-error`} variant="error">
                    {identificationError}
                  </FieldMessage>
                ) : null}
              </section>

              <section className="rounded-lg border border-[#ebebeb] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-8">
                <SectionHeading icon="file-text" title="Detalhes do Registro" />

                <div className="mt-6 grid gap-6">
                  {status !== null && statusMessage !== undefined ? (
                    <div
                      className={cx(
                        'rounded-lg px-4 py-3 text-sm leading-6 font-bold',
                        status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800',
                      )}
                      role={status === 'error' ? 'alert' : 'status'}
                    >
                      {statusMessage}
                    </div>
                  ) : null}

                  {hasSubmitErrors ? (
                    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
                      Revise os campos destacados antes de enviar a manifestação.
                    </div>
                  ) : null}

                  <SelectField
                    errorMessage={typeof typeError === 'string' ? typeError : undefined}
                    id={`${formId}-manifestation-type`}
                    label="Tipo de Manifestação"
                    options={manifestationTypes}
                    registration={form.register('manifestationType')}
                  />

                  <SelectField
                    errorMessage={typeof areaError === 'string' ? areaError : undefined}
                    id={`${formId}-area`}
                    label="Unidade responsável"
                    options={manifestationAreas}
                    registration={form.register('area')}
                  />

                  <TextInputField
                    errorMessage={typeof involvedPeopleError === 'string' ? involvedPeopleError : undefined}
                    id={`${formId}-involved-people`}
                    label="Pessoas envolvidas"
                    placeholder="Nomes ou cargos, se houver"
                    registration={form.register('involvedPeople')}
                  />

                  <TextareaField
                    errorMessage={typeof descriptionError === 'string' ? descriptionError : undefined}
                    id={`${formId}-description`}
                    label="Descrição da Manifestação"
                    placeholder="Relate o ocorrido com o máximo de detalhes possível..."
                    registration={form.register('description')}
                  />
                </div>
              </section>

              <section className="rounded-lg border border-[#ebebeb] bg-[#f7f7f8] p-6" aria-labelledby="attachments-title">
                <SectionHeading icon="upload-cloud" title="Anexos e provas" />
                <label
                  className={cx(
                    'mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white px-5 py-8 text-center transition duration-150 hover:border-[#0d47a1] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0d47a1]',
                    attachmentsError !== undefined ? 'border-[#ba1a1a]' : 'border-[rgba(114,119,127,0.3)]',
                  )}
                  htmlFor={`${formId}-attachments`}
                >
                  <Icon className="size-9 text-[#72777f]" name="upload-cloud" />
                  <span className="mt-3 text-sm leading-5 text-[#43474e]">
                    Arraste arquivos aqui ou <span className="font-bold text-[#0d47a1] underline">clique para subir</span>
                  </span>
                  <span className="mt-1 text-[10px] leading-[15px] tracking-[0.1em] text-[#72777f] uppercase">
                    PDF, JPG, PNG, DOC até 5MB
                  </span>
                  <input
                    accept="image/*,.pdf,.doc,.docx"
                    aria-invalid={attachmentsError !== undefined}
                    className="sr-only"
                    id={`${formId}-attachments`}
                    multiple
                    type="file"
                    {...form.register('attachments')}
                  />
                </label>
                {files.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {files.map((file) => (
                      <li className="truncate rounded-lg bg-white px-3 py-2 text-sm leading-5 text-[#43474e]" key={file.name}>
                        {file.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {attachmentsError !== undefined && typeof attachmentsError === 'string' ? (
                  <FieldMessage id={`${formId}-attachments-error`} variant="error">
                    {attachmentsError}
                  </FieldMessage>
                ) : null}
              </section>

              <div className="flex flex-col items-center gap-5">
                <button
                  className="inline-flex min-h-12 w-full max-w-64 items-center justify-center gap-3 rounded-lg bg-[#0d47a1] px-6 text-sm leading-5 font-bold tracking-[0.1em] text-white uppercase transition duration-150 hover:bg-[#0d47a1]/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0d47a1] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {form.formState.isSubmitting ? 'Enviando' : isEditing ? 'Salvar' : 'Registrar'}
                  <Icon className="size-4" name="send" />
                </button>
                <p className="max-w-md text-center text-xs leading-[18px] text-[#43474e]">
                  Ao enviar, você declara que as informações são verdadeiras. O prazo de resposta institucional é de até
                  30 dias úteis.
                </p>
              </div>
            </form>
          </section>
        </main>

        <SiteFooter />
      </AuthenticatedAppShell>
    </div>
  )
}
