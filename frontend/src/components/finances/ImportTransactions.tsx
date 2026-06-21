import { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, FileText, CheckCircle, AlertCircle, Briefcase, Lock } from 'lucide-react'
import { categorizeTransaction, saveTransactionRule } from './transactionCategorizer'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function ImportTransactions({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  const { user } = useAuth()
  const isFree = !user?.subscription_tier || user.subscription_tier === 'free'
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    incomeCount?: number
    expenseCount?: number
    error?: string
  } | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [saveRules, setSaveRules] = useState(true)
  const queryClient = useQueryClient()

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order')
  })

  const handleFileChange = e => {
    setFile(e.target.files[0])
    setResult(null)
  }

  const parseCSV = text => {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row = {}
      headers.forEach((header, i) => {
        row[header] = values[i]
      })
      return row
    })
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)

      // Fetch rules once before processing all rows
      const rules = await backend.entities.TransactionRule.list().catch(() => [])

      // Prepare all transactions for batch creation
      const expensesToCreate: any[] = []
      const incomesToCreate: any[] = []
      const rulesToCreate: Promise<any>[] = []

      for (const row of rows) {
        const amount = Math.abs(parseFloat(row.amount || 0))
        const description = row.description || row.title || 'Transaction'
        const date = row.date || new Date().toISOString().split('T')[0]
        const isExpense = parseFloat(row.amount || 0) < 0 || row.type?.toLowerCase() === 'expense'

        const transactionType = isExpense ? 'expense' : 'income'
        const { category, business_id } = await categorizeTransaction(
          description,
          transactionType,
          rules
        )

        const finalBusinessId = selectedBusinessId || business_id
        const transaction = {
          title: description,
          amount,
          date,
          category,
          business_id: finalBusinessId,
          notes: 'Imported from CSV'
        }

        if (isExpense) {
          expensesToCreate.push(transaction)
        } else {
          incomesToCreate.push(transaction)
        }

        // Queue rule creation if enabled
        if (saveRules) {
          const rulePromise = saveTransactionRule(
            description,
            category,
            finalBusinessId,
            transactionType,
            rules
          )
          if (rulePromise) rulesToCreate.push(rulePromise)
        }
      }

      // Create all transactions in parallel
      const [expenseResults, incomeResults] = await Promise.all([
        expensesToCreate.length > 0
          ? Promise.all(expensesToCreate.map(e => backend.entities.Expense.create(e)))
          : Promise.resolve([]),
        incomesToCreate.length > 0
          ? Promise.all(incomesToCreate.map(i => backend.entities.Income.create(i)))
          : Promise.resolve([])
      ])

      // Create all rules in parallel
      if (rulesToCreate.length > 0) {
        await Promise.all(rulesToCreate)
      }

      const incomeCount = incomeResults.length
      const expenseCount = expenseResults.length

      setResult({ success: true, incomeCount, expenseCount })
      queryClient.invalidateQueries({ queryKey: ['income'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['transactionRules'] })

      setTimeout(() => {
        onClose()
        setFile(null)
        setResult(null)
        setSelectedBusinessId(null)
      }, 2000)
    } catch (error) {
      setResult({ success: false, error: (error as Error).message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isFree && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1 text-sm text-amber-800">
                <span className="font-semibold">Plus / Pro feature.</span> CSV import is available
                on Plus and Pro plans.{' '}
                <Link
                  to="/upgrade"
                  onClick={onClose}
                  className="underline font-semibold hover:text-amber-900"
                >
                  Upgrade now
                </Link>
              </div>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${isFree ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-300'}`}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={isFree}
            />

            <label
              htmlFor="csv-upload"
              className={isFree ? 'cursor-not-allowed' : 'cursor-pointer'}
            >
              <Button variant="outline" asChild disabled={isFree}>
                <span>Select CSV File</span>
              </Button>
            </label>
            {file && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
                <FileText className="w-4" />
                {file.name}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Finance Area</label>
              <Select
                value={selectedBusinessId || 'private'}
                onValueChange={val => setSelectedBusinessId(val === 'private' ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select finance area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private / Personal</SelectItem>
                  {businesses.map(business => (
                    <SelectItem key={business.id} value={String(business.id)}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {business.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-rules"
                checked={saveRules}
                onCheckedChange={prev => setSaveRules(!!prev)}
              />

              <label
                htmlFor="save-rules"
                className="text-sm font-medium text-slate-700 cursor-pointer"
              >
                Learn and save categorization rules for future imports
              </label>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <p className="font-medium mb-2">CSV Format:</p>
            <p>Required columns: date, description (or title), amount</p>
            <p className="mt-2 text-xs">
              • Negative amounts = expenses • Positive amounts = income • Transactions are
              auto-categorized. AI trains by your rules.
            </p>
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {result.success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    Imported {result.incomeCount} income & {result.expenseCount} expenses
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Error: {result.error}</span>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing || isFree}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
