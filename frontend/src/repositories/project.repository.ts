import { db, ProjectRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateProjectInput = Omit<
  ProjectRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const projectRepository = {
  update: async (id: string, data: Partial<ProjectRecord>) => {
    let existing = await db.projects.get(id)

    if (!existing) {
      existing = await db.projects.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Project not found')
    }

    const updatedProject: ProjectRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.projects.put(updatedProject)

    await enqueueMutation('projects', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedProject
  },
  create: async (data: CreateProjectInput) => {
    const optimisticId = generateOptimisticId()
    const project = {
      ...data,
      id: optimisticId,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false,
      reminders: []
    }

    await db.projects.put(project)
    await enqueueMutation('projects', 'create', { ...data, optimisticId })

    return project
  },
  delete: async (id: string) => {
    let existing = await db.projects.get(id)

    if (!existing) {
      existing = await db.projects.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Project not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.projects.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('projects')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('projects', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })
  },
  bulkDelete: async (ids: string[]) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.projects.get(id)) ?? (await db.projects.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validProjects = targets.filter(Boolean) as ProjectRecord[]

    if (validProjects.length === 0) return []

    const updatedProjects = validProjects.map(project => ({
      ...project,
      is_deleted: true,
      updatedAt: now
    }))

    await db.transaction('rw', db.projects, db.syncQueue, async () => {
      await db.projects.bulkPut(updatedProjects)

      const idsToRemove = validProjects.flatMap(p => [p.id, p.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('projects')
        .and(item => idsToRemove.includes(item.payload?.id as string))
        .delete()

      for (const project of validProjects) {
        await enqueueMutation('projects', 'delete', {
          id: project.serverId ?? project.id,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedProjects
  },
  bulkUpdate: async (ids: string[], data: Partial<ProjectRecord>) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.projects.get(id)) ?? (await db.projects.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validProjects = targets.filter(Boolean) as ProjectRecord[]

    if (validProjects.length === 0) return []

    const updatedProjects = validProjects.map(project => ({
      ...project,
      ...data,
      updatedAt: now
    }))

    await db.transaction('rw', db.projects, db.syncQueue, async () => {
      await db.projects.bulkPut(updatedProjects)

      const idsToClean = validProjects.flatMap(p => [p.id, p.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('projects')
        .and(item => {
          const payloadId = item.payload?.id
          return typeof payloadId === 'string' && idsToClean.includes(payloadId)
        })
        .delete()

      for (const project of validProjects) {
        await enqueueMutation('projects', 'update', {
          id: project.serverId ?? project.id,
          ...data,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedProjects
  }
  /*  duplicate: async (project: ProjectRecord) => {
    const { id, serverId, createdAt, updatedAt, ...rest } = project

    const optimisticId = generateOptimisticId()

    const duplicatedProject: ProjectRecord = {
      ...rest,
      id: optimisticId,
      title: `${rest.title} (copy)`,
      status: 'active',
      order: (project.order ?? 0) + 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false
    }

    await db.projects.put(duplicatedProject)

    await enqueueMutation('projects', 'create', {
      ...duplicatedProject,
      optimisticId
    })

    return duplicatedProject
  } */
}
