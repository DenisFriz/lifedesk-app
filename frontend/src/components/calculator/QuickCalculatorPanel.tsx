import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calculator, X, Copy, Trash2, ArrowLeftRight } from 'lucide-react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface QuickCalculatorPanelProps {
  collapsed: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function QuickCalculatorPanel({ collapsed, isOpen, setIsOpen }: QuickCalculatorPanelProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isResizing, setIsResizing] = useState(false)
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('calculatorPanelWidth')
    return saved ? parseInt(saved) : 400
  })

  // Calculator state
  const [hours, setHours] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [vatRate, setVatRate] = useState('20')
  const [vatIncluded, setVatIncluded] = useState(false)
  const [costPrice, setCostPrice] = useState('')

  // Basic calculator state
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  // Converter state
  const [convertFrom, setConvertFrom] = useState('')
  const [convertTo, setConvertTo] = useState('')
  const [conversionType, setConversionType] = useState('currency')
  const [fromUnit, setFromUnit] = useState('EUR')
  const [toUnit, setToUnit] = useState('USD')
  const [currencyRate, setCurrencyRate] = useState('1.00')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [ratesLoading, setRatesLoading] = useState(false)

  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement>(null)

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    setRatesLoading(true)
    try {
      const { data } = await backend.functions.invoke('getExchangeRates')
      if (data && data.rates) {
        const allRates = { [data.base]: 1, ...data.rates }
        setExchangeRates(allRates)

        // Auto-update currency rate for current selection
        if (conversionType === 'currency') {
          const fromRate = allRates[fromUnit] || 1
          const toRate = allRates[toUnit] || 1
          const calculatedRate = (toRate / fromRate).toFixed(6)
          setCurrencyRate(calculatedRate)
        }

        toast.success('Exchange rates updated')
        return allRates
      }
    } catch (error) {
      toast.error('Failed to fetch exchange rates')
      console.error(error)
    } finally {
      setRatesLoading(false)
    }
  }

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('calculatorPreferences')
    if (saved) {
      const prefs = JSON.parse(saved)
      if (prefs.vatRate) setVatRate(prefs.vatRate)
      if (prefs.hourlyRate) setHourlyRate(prefs.hourlyRate)
      if (prefs.conversionType) setConversionType(prefs.conversionType)
      if (prefs.fromUnit) setFromUnit(prefs.fromUnit)
      if (prefs.toUnit) setToUnit(prefs.toUnit)
      if (prefs.currencyRate) setCurrencyRate(prefs.currencyRate)
    }
  }, [])

  // Fetch exchange rates on mount
  useEffect(() => {
    if (isOpen) {
      fetchExchangeRates()
    }
  }, [isOpen])

  // Save preferences
  useEffect(() => {
    const prefs = {
      vatRate,
      hourlyRate,
      conversionType,
      fromUnit,
      toUnit,
      currencyRate
    }
    localStorage.setItem('calculatorPreferences', JSON.stringify(prefs))
  }, [vatRate, hourlyRate, conversionType, fromUnit, toUnit, currencyRate])

  // Fetch history
  const { data: history = [] } = useQuery({
    queryKey: ['calculationHistory'],
    queryFn: () => backend.entities.CalculationHistory.list('-created_date', 50),
    enabled: isOpen
  })

  // Save calculation
  const saveCalculationMutation = useMutation({
    mutationFn: data => backend.entities.CalculationHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['calculationHistory'])
    }
  })

  // Delete calculation
  const deleteCalculationMutation = useMutation({
    mutationFn: id => backend.entities.CalculationHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['calculationHistory'])
      toast.success('Calculation deleted')
    }
  })

  // Calculator calculations
  const calculateResults = () => {
    const h = parseFloat(hours) || 0
    const rate = parseFloat(hourlyRate) || 0
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(unitPrice) || 0
    const disc = parseFloat(discount) || 0
    const vat = parseFloat(vatRate) || 0
    const cost = parseFloat(costPrice) || 0

    let subtotal = h * rate + qty * price
    const discountAmount = subtotal * (disc / 100)
    const net = subtotal - discountAmount

    let vatAmount, gross
    if (vatIncluded) {
      gross = net
      vatAmount = gross - gross / (1 + vat / 100)
    } else {
      vatAmount = net * (vat / 100)
      gross = net + vatAmount
    }

    const costPerUnit = qty > 0 ? net / qty : 0
    const margin = cost > 0 ? ((net - cost) / net) * 100 : 0

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      net: net.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      gross: gross.toFixed(2),
      costPerUnit: costPerUnit.toFixed(2),
      margin: margin.toFixed(2)
    }
  }

  const results = calculateResults()

  // Auto-update currency rate when units change
  useEffect(() => {
    if (conversionType === 'currency' && Object.keys(exchangeRates).length > 0) {
      const fromRate = exchangeRates[fromUnit]
      const toRate = exchangeRates[toUnit]

      if (fromRate && toRate) {
        const calculatedRate = (toRate / fromRate).toFixed(6)
        setCurrencyRate(calculatedRate)
      }
    }
  }, [fromUnit, toUnit, exchangeRates, conversionType])

  // Converter calculations
  const conversionRates = {
    currency: { custom: true },
    time: { min: 1, h: 60, d: 1440 },
    data: { KB: 1, MB: 1024, GB: 1048576, TB: 1073741824 },
    distance: { m: 1, km: 1000, mi: 1609.34, ft: 0.3048 },
    weight: { g: 1, kg: 1000, lb: 453.592, oz: 28.3495 }
  }

  const convertValue = () => {
    const value = parseFloat(convertFrom) || 0

    if (conversionType === 'currency') {
      const rate = parseFloat(currencyRate) || 1
      return (value * rate).toFixed(2)
    }

    const rates = conversionRates[conversionType]
    if (!rates) return '0'

    const fromRate = rates[fromUnit] || 1
    const toRate = rates[toUnit] || 1
    const result = (value * fromRate) / toRate
    return result.toFixed(4)
  }

  const convertedValue = convertValue()

  // Basic calculator functions
  const inputDigit = digit => {
    if (waitingForOperand) {
      setDisplay(String(digit))
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const clearDisplay = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const performOperation = nextOperation => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      let newValue = currentValue

      switch (operation) {
        case '+':
          newValue = currentValue + inputValue
          break
        case '-':
          newValue = currentValue - inputValue
          break
        case '*':
          newValue = currentValue * inputValue
          break
        case '/':
          newValue = currentValue / inputValue
          break
        case '=':
          newValue = inputValue
          break
        default:
          break
      }

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  // Copy result
  const copyResult = text => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Save and copy calculation
  const saveAndCopy = () => {
    const calcSummary = `Calculator Results:\nSubtotal: ${results.subtotal}\nDiscount: ${results.discountAmount}\nNet: ${results.net}\nVAT: ${results.vatAmount}\nGross: ${results.gross}`

    saveCalculationMutation.mutate({
      type: 'calculator',
      inputs: { hours, hourlyRate, quantity, unitPrice, discount, vatRate, vatIncluded, costPrice },
      outputs: results
    })

    copyResult(calcSummary)
  }

  // Save converter result
  const saveConversion = () => {
    const convSummary = `${convertFrom} ${fromUnit} = ${convertedValue} ${toUnit}`

    saveCalculationMutation.mutate({
      type: 'converter',
      inputs: { value: convertFrom, fromUnit, toUnit, type: conversionType, rate: currencyRate },
      outputs: { result: convertedValue }
    })

    copyResult(convSummary)
  }

  // Get sidebar width - use collapsed prop directly for reactivity
  const sidebarWidth = collapsed ? 64 : 256

  // Resize handling
  const handleMouseDown = e => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = e => {
      if (!isResizing) return
      const currentSidebarWidth = collapsed ? 64 : 256
      const newWidth = e.clientX - currentSidebarWidth
      if (newWidth >= 300 && newWidth <= 800) {
        setPanelWidth(newWidth)
        localStorage.setItem('calculatorPanelWidth', newWidth.toString())
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = e => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (activeTab === 'calculator') {
          saveAndCopy()
        } else if (activeTab === 'converter') {
          saveConversion()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeTab, convertFrom, hours, quantity])

  // Crypto icons mapping (Top 10)
  const cryptoIcons = {
    BTC: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/bitcoin.svg',
    ETH: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/ethereum.svg',
    USDT: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/tether.svg',
    BNB: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/binance-coin.svg',
    XRP: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/ripple.svg',
    SOL: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/solana.svg',
    USDC: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/usd-coin.svg',
    ADA: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/cardano.svg',
    DOGE: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/dogecoin.svg',
    TRX: 'https://cdn.jsdelivr.net/gh/madenix/Crypto-logo-cdn@main/logos/tron.svg'
  }

  // Fallback symbols for fiat currencies
  const fallbackSymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'Fr',
    CNY: '¥',
    HKD: 'HK$',
    NZD: 'NZ$',
    SEK: 'kr',
    KRW: '₩',
    SGD: 'S$',
    NOK: 'kr',
    MXN: '$',
    INR: '₹',
    RUB: '₽',
    ZAR: 'R',
    TRY: '₺',
    BRL: 'R$',
    TWD: 'NT$',
    DKK: 'kr',
    PLN: 'zł',
    THB: '฿',
    IDR: 'Rp',
    HUF: 'Ft',
    CZK: 'Kč',
    ILS: '₪',
    CLP: '$',
    PHP: '₱',
    AED: 'د.إ',
    COP: '$',
    SAR: '﷼',
    MYR: 'RM',
    RON: 'lei',
    ARS: '$',
    VND: '₫',
    BGN: 'лв',
    UAH: '₴',
    EGP: 'E£'
  }

  // Get fiat symbol using Intl.NumberFormat
  const getFiatSymbol = code => {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol'
      })
      const parts = formatter.formatToParts(1)
      const symbolPart = parts.find(p => p.type === 'currency')
      if (symbolPart && symbolPart.value && symbolPart.value !== code) {
        return symbolPart.value
      }
    } catch (e) {
      // Currency not supported by Intl
    }
    return fallbackSymbols[code] || ''
  }

  const isCrypto = code => cryptoIcons.hasOwnProperty(code)

  const getUnitOptions = () => {
    switch (conversionType) {
      case 'currency': {
        if (Object.keys(exchangeRates).length > 0) {
          return Object.keys(exchangeRates).sort()
        }
        return ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD']
      }
      case 'time':
        return ['min', 'h', 'd']
      case 'data':
        return ['KB', 'MB', 'GB', 'TB']
      case 'distance':
        return ['m', 'km', 'mi', 'ft']
      case 'weight':
        return ['g', 'kg', 'lb', 'oz']
      default:
        return []
    }
  }

  const formatCurrencyOption = code => {
    if (isCrypto(code)) {
      return code // Just the ticker for crypto
    }
    const symbol = getFiatSymbol(code)
    return symbol ? `${symbol} ${code}` : code
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-30"
            style={{ left: `${sidebarWidth}px` }}
            onClick={() => setIsOpen(false)}
          />

          {/* Resize handle */}
          <div
            className="fixed top-0 bottom-0 z-45 w-1 cursor-ew-resize hover:bg-indigo-400 transition-colors"
            style={{ left: `${sidebarWidth + panelWidth}px` }}
            onMouseDown={handleMouseDown}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: -panelWidth, left: sidebarWidth }}
            animate={{ x: 0, left: sidebarWidth }}
            exit={{ x: -panelWidth }}
            transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
            className="fixed top-0 h-full bg-white shadow-2xl z-40 flex flex-col border-r border-slate-200"
            style={{ width: `${panelWidth}px` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-900">Quick Calculator</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList
                  className="grid w-full grid-cols-4 mb-4"
                  style={{ backgroundColor: '#f6f7fb' }}
                >
                  <TabsTrigger value="basic">Calculator</TabsTrigger>
                  <TabsTrigger value="calculator">Business</TabsTrigger>
                  <TabsTrigger value="converter">Converter</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Basic Calculator Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="rounded-lg p-4 text-right" style={{ backgroundColor: '#f6f7fb' }}>
                    <div className="text-3xl font-mono font-bold text-slate-900 break-all">
                      {display}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      onClick={clearDisplay}
                      variant="outline"
                      className="h-14 text-lg font-semibold bg-red-50 hover:bg-red-100"
                    >
                      C
                    </Button>
                    <Button
                      onClick={() => setDisplay(String(parseFloat(display) / 100))}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      %
                    </Button>
                    <Button
                      onClick={() => setDisplay(String(-parseFloat(display)))}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      +/-
                    </Button>
                    <Button
                      onClick={() => performOperation('/')}
                      variant="outline"
                      className="h-14 text-lg bg-indigo-50 hover:bg-indigo-100"
                    >
                      ÷
                    </Button>

                    <Button
                      onClick={() => inputDigit(7)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      7
                    </Button>
                    <Button
                      onClick={() => inputDigit(8)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      8
                    </Button>
                    <Button
                      onClick={() => inputDigit(9)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      9
                    </Button>
                    <Button
                      onClick={() => performOperation('*')}
                      variant="outline"
                      className="h-14 text-lg bg-indigo-50 hover:bg-indigo-100"
                    >
                      ×
                    </Button>

                    <Button
                      onClick={() => inputDigit(4)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      4
                    </Button>
                    <Button
                      onClick={() => inputDigit(5)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      5
                    </Button>
                    <Button
                      onClick={() => inputDigit(6)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      6
                    </Button>
                    <Button
                      onClick={() => performOperation('-')}
                      variant="outline"
                      className="h-14 text-lg bg-indigo-50 hover:bg-indigo-100"
                    >
                      -
                    </Button>

                    <Button
                      onClick={() => inputDigit(1)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      1
                    </Button>
                    <Button
                      onClick={() => inputDigit(2)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      2
                    </Button>
                    <Button
                      onClick={() => inputDigit(3)}
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      3
                    </Button>
                    <Button
                      onClick={() => performOperation('+')}
                      variant="outline"
                      className="h-14 text-lg bg-indigo-50 hover:bg-indigo-100"
                    >
                      +
                    </Button>

                    <Button
                      onClick={() => inputDigit(0)}
                      variant="outline"
                      className="h-14 text-lg col-span-2"
                    >
                      0
                    </Button>
                    <Button onClick={inputDecimal} variant="outline" className="h-14 text-lg">
                      .
                    </Button>
                    <Button
                      onClick={() => performOperation('=')}
                      className="h-14 text-lg bg-indigo-600 hover:bg-indigo-700"
                    >
                      =
                    </Button>
                  </div>

                  <Button
                    onClick={() => copyResult(display)}
                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Result
                  </Button>
                </TabsContent>

                {/* Calculator Tab */}
                <TabsContent value="calculator" className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Hours</Label>
                        <Input
                          type="number"
                          value={hours}
                          onChange={e => setHours(e.target.value)}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hourly Rate</Label>
                        <Input
                          type="number"
                          value={hourlyRate}
                          onChange={e => setHourlyRate(e.target.value)}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={e => setQuantity(e.target.value)}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          value={unitPrice}
                          onChange={e => setUnitPrice(e.target.value)}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          value={discount}
                          onChange={e => setDiscount(e.target.value)}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">VAT %</Label>
                        <Select value={vatRate} onValueChange={setVatRate}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="7">7%</SelectItem>
                            <SelectItem value="19">19%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                            <SelectItem value="23">23%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={vatIncluded}
                        onCheckedChange={checked => setVatIncluded(!!checked)}
                        id="vat-included"
                      />
                      <Label htmlFor="vat-included" className="text-xs cursor-pointer">
                        VAT included in price
                      </Label>
                    </div>

                    <div>
                      <Label className="text-xs">Cost Price (for margin calc)</Label>
                      <Input
                        type="number"
                        value={costPrice}
                        onChange={e => setCostPrice(e.target.value)}
                        placeholder="0"
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Results */}
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold">{results.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount:</span>
                      <span className="text-red-600">-{results.discountAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-slate-600">Net:</span>
                      <span className="font-semibold">{results.net}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">VAT ({vatRate}%):</span>
                      <span>{results.vatAmount}</span>
                    </div>
                    <div className="flex justify-between text-base border-t pt-2">
                      <span className="font-semibold">Gross:</span>
                      <span className="font-bold text-indigo-600">{results.gross}</span>
                    </div>
                    {parseFloat(quantity) > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Cost per unit:</span>
                        <span>{results.costPerUnit}</span>
                      </div>
                    )}
                    {parseFloat(costPrice) > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Margin:</span>
                        <span>{results.margin}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={saveAndCopy}
                      className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy & Save
                    </Button>
                  </div>
                </TabsContent>

                {/* Converter Tab */}
                <TabsContent value="converter" className="space-y-4">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={conversionType}
                      onValueChange={val => {
                        setConversionType(val)
                        if (val === 'currency' && Object.keys(exchangeRates).length > 0) {
                          const currencies = Object.keys(exchangeRates).sort()
                          setFromUnit(currencies[0] || 'EUR')
                          setToUnit(currencies[1] || 'USD')
                        } else {
                          const units = getUnitOptions()
                          setFromUnit(units[0])
                          setToUnit(units[1] || units[0])
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="weight">Weight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {conversionType === 'currency' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Exchange Rate</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchExchangeRates}
                          disabled={ratesLoading}
                          className="h-6 text-xs"
                        >
                          {ratesLoading ? 'Updating...' : 'Update'}
                        </Button>
                      </div>
                      <div className="bg-slate-50 rounded-md px-3 py-2 text-sm font-semibold">
                        1 {fromUnit} = {currencyRate} {toUnit}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                    <div>
                      <Label className="text-xs">From</Label>
                      <Input
                        type="number"
                        value={convertFrom}
                        onChange={e => setConvertFrom(e.target.value)}
                        placeholder="0"
                        className="h-9"
                      />
                      <Select value={fromUnit} onValueChange={setFromUnit}>
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getUnitOptions().map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {conversionType === 'currency' ? (
                                isCrypto(unit) ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={cryptoIcons[unit]}
                                      alt={unit}
                                      className="w-4 h-4"
                                      onError={e => {
                                        const img = e.currentTarget
                                        img.style.display = 'none'

                                        const fallback = img.nextSibling as HTMLElement | null
                                        if (fallback) fallback.style.display = 'flex'
                                      }}
                                    />
                                    <div
                                      className="w-4 h-4 rounded-full bg-slate-200 text-[8px] font-bold flex items-center justify-center"
                                      style={{ display: 'none' }}
                                    >
                                      {unit.slice(0, 2)}
                                    </div>
                                    <span>{unit}</span>
                                  </div>
                                ) : (
                                  formatCurrencyOption(unit)
                                )
                              ) : (
                                unit
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <ArrowLeftRight className="w-4 h-4 text-slate-400 mb-4" />

                    <div>
                      <Label className="text-xs">To</Label>
                      <Input
                        value={convertedValue}
                        readOnly
                        className="h-9 bg-slate-50 font-semibold"
                      />
                      <Select value={toUnit} onValueChange={setToUnit}>
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getUnitOptions().map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {conversionType === 'currency' ? (
                                isCrypto(unit) ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={cryptoIcons[unit]}
                                      alt={unit}
                                      className="w-4 h-4"
                                      onError={e => {
                                        const img = e.currentTarget
                                        img.style.display = 'none'
                                        const fallback = img.nextSibling as HTMLElement | null
                                        if (fallback) fallback.style.display = 'flex'
                                      }}
                                    />
                                    <div
                                      className="w-4 h-4 rounded-full bg-slate-200 text-[8px] font-bold flex items-center justify-center"
                                      style={{ display: 'none' }}
                                    >
                                      {unit.slice(0, 2)}
                                    </div>
                                    <span>{unit}</span>
                                  </div>
                                ) : (
                                  formatCurrencyOption(unit)
                                )
                              ) : (
                                unit
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={saveConversion}
                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy & Save
                  </Button>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-2">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No calculations yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map(item => (
                        <div key={item.id} className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{item.type}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={() => {
                                  if (item.type === 'calculator') {
                                    const calcSummary = `Subtotal: ${item.outputs.subtotal}\nNet: ${item.outputs.net}\nGross: ${item.outputs.gross}`
                                    copyResult(calcSummary)
                                  } else {
                                    copyResult(
                                      `${item.inputs.value} ${item.inputs.fromUnit} = ${item.outputs.result} ${item.inputs.toUnit}`
                                    )
                                  }
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-600 hover:text-red-700"
                                onClick={() => deleteCalculationMutation.mutate(item.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600">
                            {item.type === 'calculator' ? (
                              <div>Gross: {item.outputs.gross}</div>
                            ) : (
                              <div>
                                {item.inputs.value} {item.inputs.fromUnit} = {item.outputs.result}{' '}
                                {item.inputs.toUnit}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(item.created_date).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
