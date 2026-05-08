import { backend } from '@/api/backend'
import { PERSONAL_CATEGORIES, BUSINESS_CATEGORIES } from './categories'

const categoryKeywords = {
  'Food & Dining': [
    'restaurant',
    'cafe',
    'coffee',
    'pizza',
    'burger',
    'food',
    'grocery',
    'supermarket',
    'starbucks',
    'mcdonalds'
  ],
  Transportation: ['uber', 'lyft', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train', 'taxi'],
  Shopping: ['amazon', 'walmart', 'target', 'store', 'shop', 'retail', 'mall'],
  Entertainment: ['netflix', 'spotify', 'movie', 'theater', 'concert', 'game', 'entertainment'],
  Utilities: ['electric', 'water', 'gas bill', 'internet', 'phone', 'utility'],
  Housing: ['rent', 'mortgage', 'lease', 'property'],
  Healthcare: ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'clinic'],
  Insurance: ['insurance', 'policy'],
  Education: ['tuition', 'school', 'course', 'education', 'books'],
  Subscriptions: ['subscription', 'membership', 'annual fee', 'monthly fee'],
  'Business Income': ['invoice', 'payment received', 'client payment'],
  Freelance: ['freelance', 'contract', 'gig'],
  Investment: ['dividend', 'stock', 'investment', 'capital gain'],
  'Office Supplies': ['office', 'supplies', 'stationery', 'printer'],
  Marketing: ['marketing', 'advertising', 'ad', 'promotion'],
  'Software & Tools': ['software', 'saas', 'subscription', 'tool', 'app']
}

export async function categorizeTransaction(description, transactionType = 'both') {
  if (!description) return { category: 'Uncategorized', business_id: null }

  const desc = description.toLowerCase()

  // First, check user-defined rules
  try {
    const rules = await backend.entities.TransactionRule.list()
    for (const rule of rules) {
      if (rule.transaction_type === transactionType || rule.transaction_type === 'both') {
        const keyword = rule.keyword.toLowerCase()
        if (desc.includes(keyword)) {
          return {
            category: rule.category,
            business_id: rule.business_id || null
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching transaction rules:', error)
  }

  // Fall back to default keyword matching
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return { category, business_id: null }
    }
  }

  return { category: 'Uncategorized', business_id: null }
}

export async function saveTransactionRule(
  description,
  category,
  businessId,
  transactionType = 'both'
) {
  if (!description) return

  // Extract a keyword from the description (first significant word)
  const keyword = description.toLowerCase().split(' ')[0]

  // Check if rule already exists
  const existingRules = await backend.entities.TransactionRule.list()
  const exists = existingRules.some(
    rule => rule.keyword.toLowerCase() === keyword && rule.transaction_type === transactionType
  )

  if (!exists) {
    await backend.entities.TransactionRule.create({
      keyword,
      category,
      business_id: businessId || null,
      transaction_type: transactionType
    })
  }
}
