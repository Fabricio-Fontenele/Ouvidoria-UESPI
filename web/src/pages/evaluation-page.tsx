import { useId, useState, type FormEvent } from 'react'

import { getSearchParams, navigateTo, normalizeProtocol, routes } from '../app/routes'
import { Icon } from '../components/icons/icon'
import { AuthenticatedAppShell } from '../components/layout/authenticated-app-shell'
import { SiteFooter } from '../components/layout/site-footer'
import { cx } from '../utils/cx'

type EvaluationStatus = 'error' | 'idle' | 'success'

const ratingOptions = [1, 2, 3, 4, 5] as const

function resolveProtocol() {
  const protocol = getSearchParams().get('protocol')

  if (protocol === null || protocol.trim() === '') {
    return null
  }

  return normalizeProtocol(protocol)
}

function ratingLabel(rating: number) {
  return `${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`
}

function RatingField({
  describedBy,
  onRatingChange,
  rating,
}: {
  describedBy?: string
  onRatingChange: (rating: number) => void
  rating: number
}) {
  return (
    <fieldset aria-describedby={describedBy}>
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
  const feedbackId = useId()
  const [comments, setComments] = useState('')
  const [rating, setRating] = useState(4)
  const [status, setStatus] = useState<EvaluationStatus>('idle')
  const protocol = resolveProtocol()
  const hasRatingError = status === 'error'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (rating < 1) {
      setStatus('error')
      return
    }

    setStatus('success')
    navigateTo(routes.home)
  }

  return (
    <div className="min-h-svh bg-white font-sans text-[#1d1b1b]">
      <AuthenticatedAppShell>
        <main className="mx-auto flex w-full max-w-5xl flex-col px-6 pt-9 pb-10 min-[390px]:px-8 md:px-10 md:pt-12">
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
              {protocol !== null ? (
                <p className="mt-4 text-sm leading-5 text-[#43474e]">
                  Protocolo avaliado: <strong className="font-bold text-[#1d1b1b]">{protocol}</strong>
                </p>
              ) : null}
            </div>

            <form className="mt-9 flex w-full max-w-[560px] flex-col gap-7 md:mt-10" noValidate onSubmit={handleSubmit}>
              <div className="space-y-7">
                <RatingField
                  describedBy={hasRatingError ? `${feedbackId}-rating-error` : undefined}
                  onRatingChange={(nextRating) => {
                    setRating(nextRating)
                    setStatus('idle')
                  }}
                  rating={rating}
                />
                {hasRatingError ? (
                  <p
                    className="text-sm leading-5 font-bold text-[#ba1a1a]"
                    id={`${feedbackId}-rating-error`}
                    role="alert"
                  >
                    Selecione uma nota para registrar a avaliação.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm leading-5 text-[#1d1b1b]" htmlFor={`${feedbackId}-comments`}>
                  Comentários adicionais:
                </label>
                <textarea
                  className="min-h-[178px] w-full resize-y rounded-lg border border-[rgba(114,119,127,0.3)] bg-white px-4 py-4 text-base leading-6 text-[#43474e] transition duration-150 placeholder:text-[#72777f]/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d47a1]"
                  id={`${feedbackId}-comments`}
                  maxLength={500}
                  onChange={(event) => {
                    setComments(event.target.value)
                    setStatus('idle')
                  }}
                  placeholder="Relate o ocorrido com o máximo de detalhes possível..."
                  value={comments}
                />
              </div>

              <button
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-[#2b5bb5] px-6 text-base leading-6 font-bold text-white transition duration-150 hover:bg-[#234d9d] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0d47a1]"
                type="submit"
              >
                Registrar Avaliação
              </button>

              <p
                aria-live="polite"
                className={cx(
                  'min-h-6 text-sm leading-6 font-semibold',
                  status === 'success' ? 'text-[#126d2c]' : 'text-[#ba1a1a]',
                )}
                role={status === 'error' ? 'alert' : 'status'}
              >
                {status === 'success'
                  ? 'Avaliação registrada. Obrigado por ajudar a melhorar a Ouvidoria UESPI.'
                  : null}
              </p>
            </form>
          </section>
        </main>

        <SiteFooter />
      </AuthenticatedAppShell>
    </div>
  )
}
