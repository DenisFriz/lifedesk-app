import React, { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Download, Filter, Calendar, DollarSign } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'

export default function TimeReports() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filterClient, setFilterClient] = useState('all')
  const [filterProject, setFilterProject] = useState('all')
  const [filterBillable, setFilterBillable] = useState('all')

  const { data: entries = [] } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => backend.entities.TimeEntry.list('-date')
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => backend.entities.Client.list('name')
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => backend.entities.Project.list('name')
  })

  const filteredEntries = entries.filter(entry => {
    if (!entry.end_time) return false // Only completed entries

    const entryDate = new Date(entry.date)
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (entryDate < start || entryDate > end) return false
    if (filterClient !== 'all' && entry.client_id !== filterClient) return false
    if (filterProject !== 'all' && entry.project_id !== filterProject) return false
    if (filterBillable === 'billable' && !entry.billable) return false
    if (filterBillable === 'non-billable' && entry.billable) return false

    return true
  })

  const totalDuration = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  const totalBillable = filteredEntries
    .filter(e => e.billable)
    .reduce((sum, entry) => sum + (entry.duration || 0), 0)

  const getClientName = clientId => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'No Client'
  }

  const getProjectName = projectId => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'No Project'
  }

  const formatDuration = minutes => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Duration (min)',
      'Client',
      'Project',
      'Description',
      'Billable'
    ]
    const rows = filteredEntries.map(entry => [
      entry.date,
      entry.start_time,
      entry.end_time || '',
      entry.duration || 0,
      getClientName(entry.client_id),
      getProjectName(entry.project_id),
      (entry.description || '').replace(/,/g, ';'),
      entry.billable ? 'Yes' : 'No'
    ])

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
  }

  const setDateRange = range => {
    const now = new Date()
    switch (range) {
      case 'today':
        setStartDate(format(now, 'yyyy-MM-dd'))
        setEndDate(format(now, 'yyyy-MM-dd'))
        break
      case 'this-week':
        setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
        setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
        break
      case 'this-month':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'))
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'))
        break
    }
  }

  return (
    <div className="min-h-screen p-6 page-bg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Time Reports</h1>
          <p className="text-slate-600">Track and analyze your time entries</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Start Date</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">End Date</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Client</label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger>
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Project</label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDateRange('today')}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDateRange('this-week')}>
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDateRange('this-month')}>
              This Month
            </Button>

            <Select value={filterBillable} onValueChange={setFilterBillable}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="billable">Billable Only</SelectItem>
                <SelectItem value="non-billable">Non-billable Only</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportCSV} variant="outline" size="sm" className="ml-auto">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Hours</p>
                <p className="text-2xl font-bold text-slate-900">{formatDuration(totalDuration)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Billable Hours</p>
                <p className="text-2xl font-bold text-slate-900">{formatDuration(totalBillable)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Entries</p>
                <p className="text-2xl font-bold text-slate-900">{filteredEntries.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Time Entries Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Billable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      No time entries found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {entry.start_time} - {entry.end_time || '...'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatDuration(entry.duration || 0)}
                      </TableCell>
                      <TableCell className="text-sm">{getClientName(entry.client_id)}</TableCell>
                      <TableCell className="text-sm">{getProjectName(entry.project_id)}</TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                        {entry.description || '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            entry.billable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {entry.billable ? 'Billable' : 'Non-billable'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
