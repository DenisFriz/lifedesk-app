import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { backend } from '@/api/backend'
import type { CommunityIdea } from '@/types/entities'

const categoryConfig = {
  new_feature: { emoji: '✨', label: 'New Feature' },
  optimization: { emoji: '⚡', label: 'Optimization' },
  ui_ux: { emoji: '🎨', label: 'UI / UX' },
  bug_fix: { emoji: '🐛', label: 'Bug Fix' },
  other: { emoji: '💡', label: 'Other' }
}

export default function WhatsNewWidget() {
  const { data: ideas = [] } = useQuery({
    queryKey: ['implementedIdeas'],
    queryFn: async () => {
      const allIdeas = (await backend.entities.CommunityIdea.filter(
        { status: 'implemented' },
        '-updated_date'
      )) as CommunityIdea[]
      return allIdeas.slice(0, 5)
    }
  })

  if (ideas.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-500 text-sm">No new features yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {ideas.map(idea => {
          const cat =
            categoryConfig[idea.category as keyof typeof categoryConfig] || categoryConfig.other
          return (
            <div
              key={idea.id}
              className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
            >
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <p className="text-xs font-medium text-slate-600 mb-2">{cat.label}</p>
              <p className="font-medium text-slate-900 text-sm line-clamp-2 mb-2">{idea.title}</p>
              <p className="text-slate-600 text-xs line-clamp-2">{idea.description}</p>
            </div>
          )
        })}
      </div>
      <div className="flex justify-center">
        <Link
          to="/CommunityHub"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          View all ideas →
        </Link>
      </div>
    </div>
  )
}
