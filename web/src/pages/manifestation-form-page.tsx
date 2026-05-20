import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId, useMemo, useState } from 'react'
import type {
  FieldError,
  FieldErrors,
  Path,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormRegisterReturn,
} from 'react-hook-form'
import { useForm, useWatch } from 'react-hook-form'

import { routes } from '../app/routes'
import { manifestantOnlyRoles } from '../app/access-policy'
import {
  getManifestationFormDefaultValues,
  manifestationFormSchema,
} from '../application/manifestations/manifestation-form-contract'
import type { ManifestationFormData } from '../application/manifestations/manifestation-form-contract'
import { manifestationTypeContracts } from '../application/manifestations/manifestation-type-contract'
import guaraMascot from '../assets/guara-mascot.png'
import { Icon } from '../components/icons/icon'
import { AuthenticatedAppShell } from '../components/layout/authenticated-app-shell'
import { SiteFooter } from '../components/layout/site-footer'
import { ManifestationSubmissionSuccess } from '../components/manifestations/manifestation-submission-success'
import { useCatalog } from '../hooks/use-catalog'
import { useManifestationsService } from '../hooks/use-manifestations-service'
import { cx } from '../utils/cx'

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

function SectionHeading({ icon, title }: { icon: 'file-text' | 'shield'; title: string }) {
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
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionValidationMessage, setSubmissionValidationMessage] = useState<string | null>(null)
  const form = useForm<ManifestationFormData>({
    defaultValues: getManifestationFormDefaultValues(),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(manifestationFormSchema),
  })
  const selectedCampusId = useWatch({ control: form.control, name: 'campusId' })
  const hasSubmitErrors = form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0
  const typeError = getFieldError(form.formState.errors, 'type')?.message
  const campusError = getFieldError(form.formState.errors, 'campusId')?.message
  const administrativeUnitError = getFieldError(form.formState.errors, 'administrativeUnitId')?.message
  const involvedPeopleError = getFieldError(form.formState.errors, 'involvedPeople')?.message
  const descriptionError = getFieldError(form.formState.errors, 'description')?.message

  const campuses = catalog?.campuses ?? []
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

  const handleInvalidSubmit: SubmitErrorHandler<ManifestationFormData> = () => {
    setSubmittedProtocol(null)
    setSubmissionError(null)
    setSubmissionValidationMessage('Não foi possível enviar. Corrija os campos indicados e tente novamente.')
  }

  const handleSubmit: SubmitHandler<ManifestationFormData> = async (values) => {
    setSubmissionError(null)
    setSubmissionValidationMessage(null)

    const involvedPeople = values.involvedPeople === undefined || values.involvedPeople === ''
      ? null
      : values.involvedPeople

    try {
      const result = await manifestationsService.create({
        administrativeUnitId: values.administrativeUnitId,
        campusId: values.campusId,
        description: values.description,
        involvedPeople,
        isAnonymous: values.isAnonymous,
        type: values.type,
      })

      setSubmittedProtocol(result.manifestation.protocol)
    } catch (creationError) {
      const message =
        creationError instanceof Error
          ? creationError.message
          : 'Não foi possível registrar a manifestação. Tente novamente.'
      setSubmissionError(message)
    }
  }

  if (submittedProtocol !== null) {
    return <ManifestationSubmissionSuccess protocol={submittedProtocol} />
  }

  const catalogIsLoading = catalogStatus === 'loading' || catalogStatus === 'idle'
  const catalogIsBroken = catalogStatus === 'error'

  return (
    <div className="min-h-svh bg-white font-sans text-[#1d1b1b]">
      <AuthenticatedAppShell allowedRoles={manifestantOnlyRoles} fixedHeader>
        <main className="mx-auto w-full max-w-5xl px-5 pt-7 pb-12 min-[390px]:px-7 sm:px-8 lg:px-10">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start lg:gap-12">
            <div className="lg:sticky lg:top-28">
              <div className="border-l-4 border-[#0d47a1] pl-4">
                <h1 className="max-w-xs text-4xl leading-10 font-bold tracking-[-0.025em] text-[#1d1b1b] sm:max-w-md sm:text-5xl sm:leading-[1.08]">
                  Registrar Manifestação
                </h1>
                <p className="mt-6 max-w-sm text-lg leading-[29px] text-[#43474e]">
                  Sua voz é fundamental para a construção de uma UESPI melhor. Preencha os campos abaixo com clareza
                  para que possamos encaminhar seu chamado com eficiência.
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
                    <div
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800"
                      role="alert"
                    >
                      {submissionError}
                    </div>
                  ) : null}

                  {submissionValidationMessage !== null ? (
                    <div
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800"
                      role="alert"
                    >
                      {submissionValidationMessage}
                    </div>
                  ) : null}

                  {hasSubmitErrors && submissionValidationMessage === null ? (
                    <div
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800"
                      role="alert"
                    >
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
                  Esta fatia integra apenas o envio identificado. O rastreio anônimo será habilitado em uma próxima
                  etapa.
                </p>
              </section>

              <div className="flex flex-col items-center gap-5">
                <button
                  className="inline-flex min-h-12 w-full max-w-64 items-center justify-center gap-3 rounded-lg bg-[#0d47a1] px-6 text-sm leading-5 font-bold tracking-[0.1em] text-white uppercase transition duration-150 hover:bg-[#0d47a1]/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0d47a1] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={form.formState.isSubmitting || catalogIsLoading || catalogIsBroken}
                  type="submit"
                >
                  {form.formState.isSubmitting ? 'Enviando' : 'Registrar'}
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
