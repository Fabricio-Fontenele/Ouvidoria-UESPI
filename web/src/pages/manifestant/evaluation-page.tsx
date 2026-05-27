import { type FormEvent, useEffect, useId, useState } from 'react'

import { manifestantOnlyRoles } from '../../app/access-policy'
import { buildManifestationDetailsHref, getSearchParams, navigateTo, routes } from '../../app/routes'
import type { ManifestationDetail } from '../../application/manifestations/manifestation-detail-contract'
import { canEvaluate, hasEvaluationRecorded } from '../../application/manifestations/manifestation-policy'
import { Icon } from '../../components/icons/icon'
import { AuthenticatedAppShell } from '../../components/layout/authenticated-app-shell'
import { SiteFooter } from '../../components/layout/site-footer'
import { useManifestationsService } from '../../hooks/use-manifestations-service'
import { resolveApiErrorMessage } from '../../infrastructure/http/resolve-api-error-message'
import { cx } from '../../utils/cx'

type DetailStatus = 'loading' | 'ready' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'error'

const ratingOptions = [1, 2, 3, 4, 5] as const
const maxCommentLength = 1000

function resolveQueryIds() {
  const params = getSearchParams()
  return {
    id: params.get('id'),
    legacyProtocol: params.get('protocol'),
  }
}

function ratingLabel(rating: number) {
  return `${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`
}

function getBlockedReason(detail: ManifestationDetail): string | null {
  if (detail.status !== 'finalized') {
    return 'A avaliação só fica disponível após a finalização da manifestação.'
  }

  if (detail.attendantUserId === null) {
    return 'Esta manifestação não recebeu atendimento; não é possível avaliá-la.'
  }

  if (hasEvaluationRecorded(detail)) {
    return 'Você já avaliou este atendimento.'
  }

  return null
}

function NotFoundCard({ description, title }: { description: string; title: string }) {
  return (
    <section className="rounded-lg bg-home-surface px-6 py-8 shadow-login-frame">
      <h1 className="text-3xl leading-9 font-black text-home-text">{title}</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-home-brown">{description}</p>
      <a
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
        href={routes.home}
      >
        Voltar para minhas manifestações
        <Icon className="size-4" name="chevron-right" />
      </a>
    </section>
  )
}

function RatingField({
  describedBy,
  disabled,
  onRatingChange,
  rating,
}: {
  describedBy?: string
  disabled?: boolean
  onRatingChange: (rating: number) => void
  rating: number
}) {
  return (
    <fieldset aria-describedby={describedBy} disabled={disabled}>
      <legend className="sr-only">Nota da avaliação</legend>
      <div className="flex w-full items-center justify-between gap-1 sm:justify-start sm:gap-3" role="radiogroup">
        {ratingOptions.map((option) => {
          const isSelected = option <= rating

          return (
            <label className="relative grid size-14 cursor-pointer place-items-center rounded-lg" key={option}>
              <input
                aria-label={ratingLabel(option)}
                checked={rating === option}
                className="peer sr-only"
                name="rating"
                onChange={() => onRatingChange(option)}
                type="radio"
                value={option}
              />
              <span className="grid size-14 place-items-center rounded-lg transition duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0d47a1]">
                <Icon
                  className={cx('size-12 transition duration-150', isSelected ? 'text-[#f4b400]' : 'text-[#d7d9dd]')}
                  name="star"
                />
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function EvaluationPage() {
  const manifestationsService = useManifestationsService()
  const feedbackId = useId()
  const { id, legacyProtocol } = resolveQueryIds()
  const [detail, setDetail] = useState<ManifestationDetail | null>(null)
  const [detailStatus, setDetailStatus] = useState<DetailStatus>('loading')
  const [detailError, setDetailError] = useState<string | null>(null)
  const [comments, setComments] = useState('')
  const [rating, setRating] = useState(0)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  useEffect(() => {
    if (id === null) {
      return
    }

    let isMounted = true

    async function load(manifestationId: string) {
      setDetailStatus('loading')
      setDetailError(null)

      try {
        const next = await manifestationsService.getById(manifestationId)
        if (!isMounted) {
          return
        }
        setDetail(next)
        setDetailStatus('ready')
      } catch (loadError) {
        if (!isMounted) {
          return
        }
        const message = resolveApiErrorMessage(loadError, 'Não foi possível carregar esta manifestação.')
        setDetailError(message)
        setDetailStatus('error')
      }
    }

    void load(id)

    return () => {
      isMounted = false
    }
  }, [id, manifestationsService])

  if (id === null) {
    return (
      <div className="min-h-svh bg-white font-sans text-[#1d1b1b]">
        <AuthenticatedAppShell allowedRoles={manifestantOnlyRoles}>
          <main className="mx-auto w-full max-w-5xl px-6 pt-9 pb-10 min-[390px]:px-8 md:px-10 md:pt-12">
            {legacyProtocol !== null && legacyProtocol.trim().length > 0 ? (
              <NotFoundCard
                description="Este link usa um formato antigo. Volte para minhas manifestações e abra a avaliação pelo detalhe da manifestação."
                title="Link em formato antigo"
              />
            ) : (
              <NotFoundCard
                description="Não recebemos o identificador da manifestação. Abra a avaliação pelo detalhe da manifestação correspondente."
                title="Manifestação não encontrada"
              />
            )}
          </main>
          <SiteFooter />
        </AuthenticatedAppShell>
      </div>
    )
  }

  const isLoading = detailStatus === 'loading'
  const blockedReason = detail !== null ? getBlockedReason(detail) : null
  const canSubmit = detail !== null && canEvaluate(detail)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit || detail === null) {
      return
    }

    if (rating < 1) {
      setValidationMessage('Selecione uma nota para registrar a avaliação.')
      setSubmitError(null)
      return
    }

    const trimmedComment = comments.trim()
    if (trimmedComment.length > maxCommentLength) {
      setValidationMessage(`O comentário deve ter no máximo ${maxCommentLength} caracteres.`)
      setSubmitError(null)
      return
    }

    setValidationMessage(null)
    setSubmitError(null)
    setSubmitStatus('submitting')

    try {
      await manifestationsService.evaluate({
        comment: trimmedComment.length === 0 ? null : trimmedComment,
        manifestationId: detail.id,
        rating,
      })
      navigateTo(buildManifestationDetailsHref(detail.id))
    } catch (evaluationError) {
      const message = resolveApiErrorMessage(
        evaluationError,
        'Não foi possível registrar a avaliação. Tente novamente.',
      )
      setSubmitError(message)
      setSubmitStatus('error')
    }
  }

  return (
    <div className="min-h-svh bg-white font-sans text-[#1d1b1b]">
      <AuthenticatedAppShell allowedRoles={manifestantOnlyRoles}>
        <main className="mx-auto flex w-full max-w-5xl flex-col px-6 pt-9 pb-10 min-[390px]:px-8 md:px-10 md:pt-12">
          {detailStatus === 'error' ? (
            <NotFoundCard
              description={detailError ?? 'Não foi possível abrir esta manifestação para avaliação.'}
              title="Não foi possível abrir a avaliação"
            />
          ) : (
            <section aria-labelledby="evaluation-title" className="w-full max-w-[672px] md:mx-auto">
              <div className="border-l-8 border-[#0d47a1] pl-6 md:pl-8">
                <h1
                  className="max-w-xs text-4xl leading-10 font-bold tracking-[-0.025em] text-[#1d1b1b] sm:max-w-lg sm:text-5xl sm:leading-[1.08]"
                  id="evaluation-title"
                >
                  <span className="block">Faça a sua</span>
                  <span className="block">Avaliação</span>
                </h1>
                <p className="mt-5 max-w-[672px] text-lg leading-[29px] text-[#43474e]">
                  Para a melhoria do nosso sistema, sua opinião é de grande valor!
                </p>
                {detail !== null ? (
                  <p className="mt-4 text-sm leading-5 text-[#43474e]">
                    Protocolo avaliado: <strong className="font-bold text-[#1d1b1b]">{detail.protocol}</strong>
                  </p>
                ) : null}
              </div>

              {blockedReason !== null ? (
                <div
                  className="mt-9 rounded-lg bg-amber-50 px-5 py-4 text-sm leading-6 font-bold text-amber-800"
                  role="status"
                >
                  {blockedReason}
                  <div className="mt-3">
                    <a
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-home-blue px-4 text-sm font-bold text-white no-underline transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
                      href={buildManifestationDetailsHref(id)}
                    >
                      Voltar para a manifestação
                      <Icon className="size-4" name="chevron-right" />
                    </a>
                  </div>
                </div>
              ) : null}

              <form
                className="mt-9 flex w-full max-w-[560px] flex-col gap-7 md:mt-10"
                noValidate
                onSubmit={(event) => void handleSubmit(event)}
              >
                <div className="space-y-7">
                  <RatingField
                    describedBy={validationMessage !== null ? `${feedbackId}-rating-error` : undefined}
                    disabled={isLoading || !canSubmit}
                    onRatingChange={(nextRating) => {
                      setRating(nextRating)
                      setValidationMessage(null)
                      setSubmitError(null)
                    }}
                    rating={rating}
                  />
                  {validationMessage !== null ? (
                    <p
                      className="text-sm leading-5 font-bold text-[#ba1a1a]"
                      id={`${feedbackId}-rating-error`}
                      role="alert"
                    >
                      {validationMessage}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm leading-5 text-[#1d1b1b]" htmlFor={`${feedbackId}-comments`}>
                    Comentários adicionais:
                  </label>
                  <textarea
                    className="min-h-[178px] w-full resize-y rounded-lg border border-[rgba(114,119,127,0.3)] bg-white px-4 py-4 text-base leading-6 text-[#43474e] transition duration-150 placeholder:text-[#72777f]/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d47a1] disabled:cursor-not-allowed disabled:bg-home-action/30"
                    disabled={isLoading || !canSubmit}
                    id={`${feedbackId}-comments`}
                    maxLength={maxCommentLength}
                    onChange={(event) => {
                      setComments(event.target.value)
                      setValidationMessage(null)
                      setSubmitError(null)
                    }}
                    placeholder="Relate o ocorrido com o máximo de detalhes possível..."
                    value={comments}
                  />
                </div>

                {submitError !== null ? (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
                    {submitError}
                  </p>
                ) : null}

                <button
                  className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-[#2b5bb5] px-6 text-base leading-6 font-bold text-white transition duration-150 hover:bg-[#234d9d] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0d47a1] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isLoading || !canSubmit || submitStatus === 'submitting'}
                  type="submit"
                >
                  {submitStatus === 'submitting' ? 'Registrando...' : 'Registrar Avaliação'}
                </button>
              </form>
            </section>
          )}
        </main>

        <SiteFooter />
      </AuthenticatedAppShell>
    </div>
  )
}
