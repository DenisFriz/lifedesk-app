import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

type TablePaginationProps = {
  totalItems: number
  page: number
  perPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPerPageChange: (value: number) => void
}

export function TablePagination({
  totalItems,
  page,
  perPage,
  totalPages,
  onPageChange,
  onPerPageChange
}: TablePaginationProps) {
  return (
    <div className="goal-table-pagination flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 px-4 pb-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700">Show</span>

        <Select
          value={String(perPage)}
          onValueChange={value => {
            onPerPageChange(Number(value))
          }}
        >
          <SelectTrigger className="w-24 h-9">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {[20, 50, 100].map(value => (
              <SelectItem key={value} value={value.toString()}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-slate-700">of {totalItems} entries</span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>

        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
