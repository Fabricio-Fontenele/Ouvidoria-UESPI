import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type {
  FieldError,
  FieldErrors,
  Path,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormRegisterReturn,
} from 'react-hook-form'
import { useForm, useWatch } from 'react-hook-form'

import { manifestantOnlyRoles } from '../../app/access-policy'
import { routes } from '../../app/routes'
import type { GuaraChatDraft } from '../../application/guara-chat/guara-chat-types'
import {
  ACCEPTED_ATTACHMENT_INPUT_ACCEPT,
  validateAttachmentFiles,
} from '../../application/manifestations/attachment-policy'
import {
  getManifestationFormDefaultValues,
  getManifestationFormDefaultValuesFromDraft,
  manifestationFormSchema,
} from '../../application/manifestations/manifestation-form-contract'
import type { CatalogLookup, ManifestationFormData } from '../../application/manifestations/manifestation-form-contract'
import { manifestationTypeContracts } from '../../application/manifestations/manifestation-type-contract'
import guaraMascot from '../../assets/guara-mascot.png'
import { formatFileSize } from '../../components/forms/form-file-utils'
import { Icon } from '../../components/icons/icon'
import { AppHeader } from '../../components/layout/app-header'
import { AuthenticatedAppShell } from '../../components/layout/authenticated-app-shell'
import { SiteFooter } from '../../components/layout/site-footer'
import { ManifestationSubmissionSuccess } from '../../components/manifestations/manifestation-submission-success'
import { useAuth } from '../../hooks/use-auth'
import { useCatalog } from '../../hooks/use-catalog'
import { useManifestationsService } from '../../hooks/use-manifestations-service'
import { resolveApiErrorMessage } from '../../infrastructure/http/resolve-api-error-message'
import { consumePendingDraft } from '../../infrastructure/guara-chat/guara-chat-storage'
import { cx } from '../../utils/cx'

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
      className={cx('mt-1 text-xs leading-5', variant === 'error' ? 'font-bold text-[#ba1a1a]' : 'text-[#5b403d]')}
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

function SectionHeading({ icon, title }: { icon: 'file-text' | 'shield' | 'upload-cloud'; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm leading-5 font-bold tracking-[0.035em] text-[#0d47a1] uppercase">
      <Icon className="size-4" name={icon} />
      {title}
    </h2>
  )
}

export function ManifestationFormPage() {
  const formId = useId()
  const manifestationsService = useManifestationsService()
  const { catalog, error: catalogError, status: catalogStatus } = useCatalog()
  const { isAuthenticated, isLoading: authIsLoading } = useAuth()
  const [pendingDraft] = useState<GuaraChatDraft | null>(() => consumePendingDraft())
  const draftAppliedRef = useRef(false)
  const [submittedManifestation, setSubmittedManifestation] = useState<{
    accessCode: string | null
    id: string
    protocol: string
    uploadWarning?: string
  } | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionValidationMessage, setSubmissionValidationMessage] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const form = useForm<ManifestationFormData>({
    defaultValues: getManifestationFormDefaultValues(),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(manifestationFormSchema),
  })

  const renderAsPublic = !authIsLoading && !isAuthenticated
  const renderAsPublicDraft = renderAsPublic && pendingDraft !== null
  const selectedCampusId = useWatch({ control: form.control, name: 'campusId' })
  const isAnonymous = useWatch({ control: form.control, name: 'isAnonymous' })
  const hasSubmitErrors = form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0
  const typeError = getFieldError(form.formState.errors, 'type')?.message
  const campusError = getFieldError(form.formState.errors, 'campusId')?.message
  const administrativeUnitError = getFieldError(form.formState.errors, 'administrativeUnitId')?.message
  const involvedPeopleError = getFieldError(form.formState.errors, 'involvedPeople')?.message
  const descriptionError = getFieldError(form.formState.errors, 'description')?.message

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const validation = validateAttachmentFiles(files, 0)

    if (!validation.valid) {
      event.target.value = ''
      setSelectedFiles([])
      setAttachmentError(validation.message)
      return
    }

    setSelectedFiles(files)
    setAttachmentError(null)
  }

  function handleRemoveAttachment(indexToRemove: number) {
    setSelectedFiles((current) => current.filter((_, index) => index !== indexToRemove))
    setAttachmentError(null)
  }

  const campuses = useMemo(() => catalog?.campuses ?? [], [catalog])
  const administrativeUnitsForCampus = useMemo(() => {
    const campus = campuses.find((entry) => entry.id === selectedCampusId)
    return campus?.administrativeUnits ?? []
  }, [campuses, selectedCampusId])

  useEffect(() => {
    if (selectedCampusId === undefined || selectedCampusId === '') {
      return
    }

    const currentUnit = form.getValues('administrativeUnitId')

    if (currentUnit === '') {
      return
    }

    const stillValid = administrativeUnitsForCampus.some((unit) => unit.id === currentUnit)

    if (!stillValid) {
      form.setValue('administrativeUnitId', '', { shouldValidate: false })
    }
  }, [administrativeUnitsForCampus, form, selectedCampusId])

  useEffect(() => {
    if (pendingDraft === null || draftAppliedRef.current || catalog === null) {
      return
    }

    const catalogLookup: CatalogLookup = {
      administrativeUnitBelongsToCampus: (campusId, administrativeUnitId) => {
        const campus = catalog.campuses.find((entry) => entry.id === campusId)

        if (campus === undefined) {
          return false
        }

        return campus.administrativeUnits.some((unit) => unit.id === administrativeUnitId)
      },
      campusExists: (campusId) => catalog.campuses.some((entry) => entry.id === campusId),
    }

    const defaults = getManifestationFormDefaultValuesFromDraft(pendingDraft, {
      catalog: catalogLookup,
      isAuthenticated,
    })

    form.reset(defaults)
    draftAppliedRef.current = true
  }, [catalog, form, isAuthenticated, pendingDraft])

  useEffect(() => {
    if (!renderAsPublic || pendingDraft !== null) {
      return
    }

    form.setValue('isAnonymous', true)
  }, [form, pendingDraft, renderAsPublic])

  const handleInvalidSubmit: SubmitErrorHandler<ManifestationFormData> = () => {
    setSubmittedManifestation(null)
    setSubmissionError(null)
    setSubmissionValidationMessage('Não foi possível enviar. Corrija os campos indicados e tente novamente.')
  }

  const handleSubmit: SubmitHandler<ManifestationFormData> = async (values) => {
    setSubmissionError(null)
    setSubmissionValidationMessage(null)
    setAttachmentError(null)

    const attachmentValidation = validateAttachmentFiles(selectedFiles, 0)

    if (!attachmentValidation.valid) {
      setAttachmentError(attachmentValidation.message)
      return
    }

    const involvedPeople =
      values.involvedPeople === undefined || values.involvedPeople === '' ? null : values.involvedPeople

    try {
      const result = await manifestationsService.create({
        administrativeUnitId: values.administrativeUnitId,
        campusId: values.campusId,
        description: values.description,
        involvedPeople,
        isAnonymous: values.isAnonymous,
        type: values.type,
      })

      let uploadWarning: string | undefined

      try {
        for (const file of selectedFiles) {
          if (result.accessCode === null) {
            await manifestationsService.uploadAttachment({
              file,
              manifestationId: result.manifestation.id,
            })
          } else {
            await manifestationsService.uploadTrackedAttachment({
              accessCode: result.accessCode,
              file,
              protocol: result.manifestation.protocol,
            })
          }
        }
      } catch (uploadError) {
        uploadWarning = `A manifestação foi registrada, mas nem todos os anexos foram enviados. ${resolveApiErrorMessage(
          uploadError,
          'Tente reenviá-los na tela da manifestação.',
        )}`
      }

      setSubmittedManifestation({
        accessCode: result.accessCode,
        id: result.manifestation.id,
        protocol: result.manifestation.protocol,
        uploadWarning,
      })
    } catch (creationError) {
      const message = resolveApiErrorMessage(
        creationError,
        'Não foi possível registrar a manifestação. Tente novamente.',
      )
      setSubmissionError(message)
    }
  }

  if (submittedManifestation !== null) {
    return (
      <ManifestationSubmissionSuccess
        accessCode={submittedManifestation.accessCode}
        id={submittedManifestation.id}
        protocol={submittedManifestation.protocol}
        uploadWarning={submittedManifestation.uploadWarning}
      />
    )
  }

  const catalogIsLoading = catalogStatus === 'loading' || catalogStatus === 'idle'
  const catalogIsBroken = catalogStatus === 'error'

  if (authIsLoading) {
    return (
      <div className="min-h-svh bg-landing-surface font-sans text-landing-text">
        <AppHeader isAuthenticated={false} />
        <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
          <p className="text-base leading-7 text-landing-brown" role="status">
            Carregando...
          </p>
        </main>
      </div>
    )
  }

  const formContent = (
    <main className="mx-auto w-full max-w-5xl px-5 pt-7 pb-12 min-[390px]:px-7 sm:px-8 lg:px-10">
      {renderAsPublic ? (
        <div
          className="mb-6 rounded-lg border border-[#0d47a1]/20 bg-[#e8eefb] px-4 py-3 text-sm leading-6 font-bold text-[#0d47a1]"
          role="status"
        >
          {renderAsPublicDraft
            ? 'Você está registrando uma manifestação anônima a partir da conversa com o Guará. Revise as informações antes de enviar — o protocolo e o código de acesso aparecem uma única vez.'
            : 'Você está registrando uma manifestação anônima. Guarde o protocolo e o código de acesso que serão exibidos após o envio — eles são a única forma de acompanhar a manifestação.'}
        </div>
      ) : null}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start lg:gap-12">
        <div className="lg:sticky lg:top-28">
          <div className="border-l-4 border-[#0d47a1] pl-4">
            <h1 className="max-w-xs text-4xl leading-10 font-bold tracking-[-0.025em] text-[#1d1b1b] sm:max-w-md sm:text-5xl sm:leading-[1.08]">
              Registrar Manifestação
            </h1>
            <p className="mt-6 max-w-sm text-lg leading-[29px] text-[#43474e]">
              Sua voz é fundamental para a construção de uma UESPI melhor. Preencha os campos abaixo com clareza para
              que possamos encaminhar seu chamado com eficiência.
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
          <section className="rounded-lg border border-[#ebebeb] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-8">
            <SectionHeading icon="file-text" title="Detalhes do Registro" />

            <div className="mt-6 grid gap-6">
              {submissionError !== null ? (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
                  {submissionError}
                </div>
              ) : null}

              {submissionValidationMessage !== null ? (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
                  {submissionValidationMessage}
                </div>
              ) : null}

              {hasSubmitErrors && submissionValidationMessage === null ? (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
                  Revise os campos destacados antes de enviar a manifestação.
                </div>
              ) : null}

              {catalogIsBroken ? (
                <div
                  className="rounded-lg bg-amber-50 px-4 py-3 text-sm leading-6 font-bold text-amber-800"
                  role="alert"
                >
                  Não foi possível carregar o catálogo institucional.{' '}
                  {catalogError ?? 'Recarregue a página para tentar novamente.'}
                </div>
              ) : null}

              <FieldChrome
                errorMessage={typeof typeError === 'string' ? typeError : undefined}
                id={`${formId}-type`}
                label="Tipo de Manifestação"
              >
                <select
                  aria-describedby={typeError !== undefined ? `${formId}-type-error` : undefined}
                  aria-invalid={typeError !== undefined}
                  className={inputClassName(typeError !== undefined, 'h-12 appearance-auto py-0')}
                  id={`${formId}-type`}
                  {...form.register('type')}
                >
                  <option value="">Selecione</option>
                  {manifestationTypeContracts.map((typeContract) => (
                    <option key={typeContract.value} value={typeContract.value}>
                      {typeContract.label}
                    </option>
                  ))}
                </select>
              </FieldChrome>

              <FieldChrome
                errorMessage={typeof campusError === 'string' ? campusError : undefined}
                id={`${formId}-campus`}
                label="Campus"
              >
                <select
                  aria-describedby={campusError !== undefined ? `${formId}-campus-error` : undefined}
                  aria-invalid={campusError !== undefined}
                  className={inputClassName(campusError !== undefined, 'h-12 appearance-auto py-0')}
                  disabled={catalogIsLoading || catalogIsBroken}
                  id={`${formId}-campus`}
                  {...form.register('campusId')}
                >
                  <option value="">{catalogIsLoading ? 'Carregando catálogo...' : 'Selecione um campus'}</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.label}
                      {campus.city === null ? '' : ` — ${campus.city}`}
                    </option>
                  ))}
                </select>
              </FieldChrome>

              <FieldChrome
                errorMessage={typeof administrativeUnitError === 'string' ? administrativeUnitError : undefined}
                id={`${formId}-administrative-unit`}
                label="Unidade administrativa"
              >
                <select
                  aria-describedby={
                    administrativeUnitError !== undefined ? `${formId}-administrative-unit-error` : undefined
                  }
                  aria-invalid={administrativeUnitError !== undefined}
                  className={inputClassName(administrativeUnitError !== undefined, 'h-12 appearance-auto py-0')}
                  disabled={
                    catalogIsLoading ||
                    catalogIsBroken ||
                    selectedCampusId === '' ||
                    administrativeUnitsForCampus.length === 0
                  }
                  id={`${formId}-administrative-unit`}
                  {...form.register('administrativeUnitId')}
                >
                  <option value="">
                    {selectedCampusId === '' ? 'Selecione o campus primeiro' : 'Selecione uma unidade'}
                  </option>
                  {administrativeUnitsForCampus.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </FieldChrome>

              <TextInputField
                errorMessage={typeof involvedPeopleError === 'string' ? involvedPeopleError : undefined}
                id={`${formId}-involved-people`}
                label="Pessoas envolvidas (opcional)"
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

          <section className="rounded-lg border border-[#ebebeb] bg-[#f7f7f8] p-6" aria-labelledby="privacy-title">
            <SectionHeading icon="shield" title="Configurações de sigilo" />
            <p className="mt-3 text-sm leading-5 text-[#43474e]" id="privacy-title">
              Escolha se deseja registrar a manifestação vinculada à sua conta ou apenas com protocolo e código de
              acesso.
            </p>

            <label className="mt-5 flex items-start gap-3 rounded-lg border border-[rgba(114,119,127,0.25)] bg-white p-4 text-sm leading-6 text-[#43474e]">
              <input
                className="mt-1 size-4 accent-[#0d47a1]"
                disabled={renderAsPublic}
                type="checkbox"
                {...form.register('isAnonymous')}
              />
              <span>
                <span className="block font-bold text-[#1d1b1b]">Registrar como manifestação anônima</span>
                <span className="mt-1 block">
                  {renderAsPublic
                    ? 'Como você não está autenticado, esta manifestação será registrada anonimamente. O protocolo e o código de acesso serão exibidos uma única vez após o envio.'
                    : 'O protocolo e o código de acesso serão exibidos uma única vez após o envio.'}
                </span>
              </span>
            </label>
          </section>

          <section className="rounded-lg border border-[#ebebeb] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-8">
            <SectionHeading icon="upload-cloud" title="Anexos" />
            <p className="mt-3 text-sm leading-5 text-[#43474e]">
              Você pode enviar até 5 arquivos em PDF, JPG, PNG ou WEBP, com até 10 MB cada.
            </p>

            <label
              className="mt-5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgba(114,119,127,0.3)] bg-[#f7f7f8] px-4 py-5 text-center text-sm leading-5 text-[#5b403d] transition duration-150 hover:border-[#0d47a1] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0d47a1]"
              htmlFor={`${formId}-attachments`}
            >
              <Icon className="mb-2 size-6 text-[#0d47a1]" name="upload-cloud" />
              Selecionar anexos
              <input
                accept={ACCEPTED_ATTACHMENT_INPUT_ACCEPT}
                className="sr-only"
                id={`${formId}-attachments`}
                multiple
                onChange={handleAttachmentChange}
                type="file"
              />
            </label>

            {attachmentError !== null ? <FieldMessage variant="error">{attachmentError}</FieldMessage> : null}

            {selectedFiles.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <li
                    className="flex items-center gap-3 rounded-lg border border-[rgba(114,119,127,0.22)] bg-[#f7f7f8] px-3 py-2 text-sm text-[#43474e]"
                    key={`${file.name}-${file.size}`}
                  >
                    <Icon className="size-4 shrink-0 text-[#0d47a1]" name="file-text" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-[#1d1b1b]">{file.name}</span>
                      <span className="block text-xs">{formatFileSize(file.size)}</span>
                    </span>
                    <button
                      aria-label={`Remover ${file.name}`}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-[#5b403d] transition duration-150 hover:bg-[#e8eefb] hover:text-[#0d47a1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d47a1]"
                      onClick={() => handleRemoveAttachment(index)}
                      type="button"
                    >
                      <Icon className="size-4" name="x" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <div className="flex flex-col items-center gap-5">
            <button
              className="inline-flex min-h-12 w-full max-w-64 items-center justify-center gap-3 rounded-lg bg-[#0d47a1] px-6 text-sm leading-5 font-bold tracking-[0.1em] text-white uppercase transition duration-150 hover:bg-[#0d47a1]/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0d47a1] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={form.formState.isSubmitting || catalogIsLoading || catalogIsBroken}
              type="submit"
            >
              {form.formState.isSubmitting
                ? selectedFiles.length > 0
                  ? 'Enviando registro e anexos'
                  : 'Enviando'
                : isAnonymous
                  ? 'Registrar anonimamente'
                  : 'Registrar'}
              <Icon className="size-4" name="send" />
            </button>
            <p className="max-w-md text-center text-xs leading-[18px] text-[#43474e]">
              Ao enviar, você declara que as informações são verdadeiras. O prazo de resposta institucional é de até 30
              dias úteis.
            </p>
          </div>
        </form>
      </section>
    </main>
  )

  if (renderAsPublic) {
    return (
      <div className="min-h-svh bg-white font-sans text-[#1d1b1b]">
        <div className="fixed inset-x-0 top-0 z-50">
          <AppHeader isAuthenticated={false} />
        </div>
        <div aria-hidden="true" className="h-22 md:h-24" />
        {formContent}
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-white font-sans text-[#1d1b1b]">
      <AuthenticatedAppShell allowedRoles={manifestantOnlyRoles} fixedHeader>
        {formContent}
        <SiteFooter />
      </AuthenticatedAppShell>
    </div>
  )
}
