import { Icon } from '../icons/icon'
import { cx } from '../../utils/cx'

interface PaginationControlsProps {
  ariaLabel: string
  isLoading?: boolean
  onPageChange: (page: number) => void
  page: number
  totalPages: number
}

const MAX_VISIBLE_PAGES = 5

function getVisiblePages(page: number, totalPages: number) {
  const visibleCount = Math.min(MAX_VISIBLE_PAGES, totalPages)
  const leftOffset = Math.floor(visibleCount / 2)
  const firstPage = Math.min(Math.max(page - leftOffset, 1), Math.max(totalPages - visibleCount + 1, 1))

  return Array.from({ length: visibleCount }, (_entry, index) => firstPage + index)
}

export function PaginationControls({
  ariaLabel,
  isLoading = false,
  onPageChange,
  page,
  totalPages,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null
  }

  const visiblePages = getVisiblePages(page, totalPages)
  const canGoPrevious = page > 1 && !isLoading
  const canGoNext = page < totalPages && !isLoading

  return (
    <nav aria-label={ariaLabel} className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full px-1 py-1">
        <button
          aria-label="Página anterior"
          className="grid size-10 place-items-center rounded-full border border-login-brown/10 bg-home-surface text-home-text shadow-login-card transition duration-150 hover:bg-home-action disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <Icon className="size-4" name="chevron-left" />
        </button>

        <ol className="flex items-center gap-2">
          {visiblePages.map((visiblePage) => {
            const isCurrent = visiblePage === page

            return (
              <li key={visiblePage}>
                <button
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={isCurrent ? `Página ${visiblePage}, página atual` : `Ir para a página ${visiblePage}`}
                  className={cx(
                    'grid size-10 place-items-center rounded-full border text-sm leading-none font-black tabular-nums shadow-login-card transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue',
                    isCurrent
                      ? 'border-home-blue bg-home-blue text-white'
                      : 'border-login-brown/10 bg-home-surface text-home-text hover:bg-home-action',
                  )}
                  disabled={isLoading || isCurrent}
                  onClick={() => onPageChange(visiblePage)}
                  type="button"
                >
                  {visiblePage}
                </button>
              </li>
            )
          })}
        </ol>

        <button
          aria-label="Próxima página"
          className="grid size-10 place-items-center rounded-full border border-login-brown/10 bg-home-surface text-home-text shadow-login-card transition duration-150 hover:bg-home-action disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <Icon className="size-4" name="chevron-right" />
        </button>
      </div>
    </nav>
  )
}
