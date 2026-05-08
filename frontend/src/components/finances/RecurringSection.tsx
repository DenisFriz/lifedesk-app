import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import RecurringIncomeList from './RecurringIncomeList'
import RecurringExpenseList from './RecurringExpenseList'

export default function RecurringSection() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Recurring Transactions</h2>

      <Tabs defaultValue="income" className="space-y-6">
        <TabsList>
          <TabsTrigger value="income">Recurring Income</TabsTrigger>
          <TabsTrigger value="expenses">Recurring Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <RecurringIncomeList />
        </TabsContent>

        <TabsContent value="expenses">
          <RecurringExpenseList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
