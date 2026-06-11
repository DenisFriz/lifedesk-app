import {
  BodyMeasurementRecord,
  BusinessRecord,
  ClientRecord,
  EstateRecord,
  EventRecord,
  ExpenseRecord,
  GoalRecord,
  HobbyRecord,
  IncomeRecord,
  LearningRecord,
  MarketingCampaignRecord,
  MarketingContentRecord,
  MarketingStrategyRecord,
  MedicalDocumentRecord,
  NoteRecord,
  OfflineAccountRecord,
  OtherAssetRecord,
  ProblemRecord,
  ProgressPhotoRecord,
  ProjectRecord,
  RelationShipRecord,
  TaskRecord,
  TimeEntryRecord,
  VehicleRecord,
  WorkoutPlanRecord,
  WorkoutRecord
} from '@/db'

export function normalizeGoal(serverGoal: any): GoalRecord {
  return {
    id: serverGoal._id,
    title: serverGoal.title,
    description: serverGoal.description ?? null,
    category: serverGoal.category ?? null,
    status: serverGoal.status,
    order: serverGoal.order ?? null,
    important: serverGoal.important ?? false,
    target_date: serverGoal.target_date ?? null,
    target_time: serverGoal.target_time ?? null,
    business_id: serverGoal.business_id ?? null,
    is_deleted: serverGoal.is_deleted ?? false,
    reminders: serverGoal.reminders ?? null,
    createdAt: serverGoal.createdAt,
    updatedAt: serverGoal.updatedAt
  }
}

export function normalizeTask(serverTask: any): TaskRecord {
  return {
    id: serverTask._id,
    title: serverTask.title,
    description: serverTask.description ?? null,
    category: serverTask.category ?? null,
    status: serverTask.status,
    order: serverTask.order ?? null,
    important: serverTask.important ?? false,
    is_deleted: serverTask.is_deleted ?? false,
    business_id: serverTask.business_id ?? null,
    goal_id: serverTask.goal_id ?? null,
    created_by: serverTask.created_by ?? null,
    due_date: serverTask.due_date ?? null,
    due_time: serverTask.due_time ?? null,
    reminders: serverTask.reminders ?? [],
    is_recurring: serverTask.is_recurring ?? false,
    recurrence_frequency: serverTask.recurrence_frequency ?? null,
    recurrence_interval: serverTask.recurrence_interval ?? 1,
    recurrence_days_of_week: serverTask.recurrence_days_of_week ?? [],
    recurrence_monthly_type: serverTask.recurrence_monthly_type ?? null,
    recurrence_end_type: serverTask.recurrence_end_type ?? null,
    recurrence_end_date: serverTask.recurrence_end_date ?? null,
    recurrence_end_count: serverTask.recurrence_end_count ?? null,
    excluded_dates: serverTask.excluded_dates ?? [],
    parent_recurring_task_id: serverTask.parent_recurring_task_id ?? null,
    deleted_at: serverTask.deleted_at ?? null,
    deleted_by_process: serverTask.deleted_by_process ?? null,
    priority: null,
    problem_id: null,
    createdAt: serverTask.createdAt,
    updatedAt: serverTask.updatedAt
  }
}

export function normalizeEvent(serverEvent: any): EventRecord {
  return {
    id: serverEvent._id,
    created_by: serverEvent.created_by,
    title: serverEvent.title,
    description: serverEvent.description ?? null,
    category: serverEvent.category ?? null,
    business_id: serverEvent.business_id ?? null,
    important: serverEvent.important ?? false,
    start_date: serverEvent.start_date ?? null,
    start_time: serverEvent.start_time ?? null,
    end_date: serverEvent.end_date ?? null,
    end_time: serverEvent.end_time ?? null,
    reminders: serverEvent.reminders ?? [],
    status: serverEvent.status,
    is_recurring: serverEvent.is_recurring ?? false,
    recurrence_frequency: serverEvent.recurrence_frequency ?? null,
    recurrence_interval: serverEvent.recurrence_interval ?? 1,
    recurrence_days_of_week: serverEvent.recurrence_days_of_week ?? [],
    recurrence_end_type: serverEvent.recurrence_end_type ?? 'never',
    recurrence_end_date: serverEvent.recurrence_end_date ?? null,
    recurrence_end_count: serverEvent.recurrence_end_count ?? null,
    excluded_dates: serverEvent.excluded_dates ?? [],
    parent_recurring_event_id: serverEvent.parent_recurring_event_id ?? null,
    order: serverEvent.order ?? null,
    is_deleted: serverEvent.is_deleted ?? false,
    deleted_at: serverEvent.deleted_at ?? null,
    deleted_by_process: serverEvent.deleted_by_process ?? null,
    createdAt: serverEvent.createdAt,
    updatedAt: serverEvent.updatedAt
  }
}

export function normalizeVehicle(serverVehicle: any): VehicleRecord {
  return {
    id: serverVehicle._id,
    title: serverVehicle.title,
    make: serverVehicle.make ?? null,
    model: serverVehicle.model ?? null,
    year: serverVehicle.year ?? null,
    color: serverVehicle.color ?? null,
    fuel_type: serverVehicle.fuel_type ?? null,
    transmission: serverVehicle.transmission ?? null,
    mileage: serverVehicle.mileage ?? null,
    license_plate: serverVehicle.license_plate ?? null,
    vin: serverVehicle.vin ?? null,
    purchase_price: serverVehicle.purchase_price ?? null,
    current_value: serverVehicle.current_value ?? null,
    purchase_date: serverVehicle.purchase_date ?? null,
    insurance_expiry: serverVehicle.insurance_expiry ?? null,
    inspection_expiry: serverVehicle.inspection_expiry ?? null,
    notes: serverVehicle.notes ?? '',
    images: (serverVehicle.images ?? []).map((img: any) => ({
      url: img.url,
      thumbnailUrl: img.thumbnailUrl ?? null,
      uploadedAt: img.uploadedAt
    })),
    repairs: (serverVehicle.repairs ?? []).map((r: any) => ({
      date: r.date ?? null,
      cost: r.cost ?? null,
      description: r.description ?? '',
      images: r.images ?? []
    })),
    is_deleted: serverVehicle.is_deleted ?? false,
    createdAt: serverVehicle.createdAt,
    updatedAt: serverVehicle.updatedAt
  }
}

export function normalizeEstate(serverEstate: any): EstateRecord {
  return {
    id: serverEstate._id,
    title: serverEstate.title,
    description: serverEstate.description ?? '',
    property_type: serverEstate.property_type ?? null,
    address: serverEstate.address ?? null,
    area_sqm: serverEstate.area_sqm ?? null,
    rooms: serverEstate.rooms ?? null,
    floor: serverEstate.floor ?? null,
    year_built: serverEstate.year_built ?? null,
    purchase_price: serverEstate.purchase_price ?? null,
    current_value: serverEstate.current_value ?? null,
    purchase_date: serverEstate.purchase_date ?? null,
    mortgage_amount: serverEstate.mortgage_amount ?? null,
    monthly_rent: serverEstate.monthly_rent ?? null,
    monthly_costs: serverEstate.monthly_costs ?? null,
    monthly_mortgage_payment: serverEstate.monthly_mortgage_payment ?? null,
    is_deleted: serverEstate.is_deleted ?? false,
    createdAt: serverEstate.createdAt,
    updatedAt: serverEstate.updatedAt
  }
}

export function normalizeOtherAsset(serverAsset: any): OtherAssetRecord {
  return {
    id: serverAsset._id,
    title: serverAsset.title,
    description: serverAsset.description ?? '',
    category: serverAsset.category ?? null,
    purchase_price: serverAsset.purchase_price ?? null,
    current_value: serverAsset.current_value ?? null,
    purchase_date: serverAsset.purchase_date ?? null,
    location: serverAsset.location ?? null,
    is_deleted: serverAsset.is_deleted ?? false,
    createdAt: serverAsset.createdAt,
    updatedAt: serverAsset.updatedAt
  }
}

export function normalizeLearning(serverLearning: any): LearningRecord {
  return {
    id: serverLearning._id,
    title: serverLearning.title,
    type: serverLearning.type ?? null,
    status: serverLearning.status ?? null,
    progress: serverLearning.progress ?? null,
    description: serverLearning.description ?? null,
    url: serverLearning.url ?? null,
    skill_category: serverLearning.skill_category ?? null,
    priority: serverLearning.priority ?? null,
    start_date: serverLearning.start_date ?? null,
    completed_date: serverLearning.completed_date ?? null,
    time_invested_hours: serverLearning.time_invested_hours ?? null,
    rating: serverLearning.rating ?? null,
    key_takeaways: serverLearning.key_takeaways ?? null,
    author: serverLearning.author ?? null,
    is_deleted: serverLearning.is_deleted ?? false,
    deleted_at: serverLearning.deleted_at ?? null,
    deleted_by_process: serverLearning.deleted_by_process ?? null,
    createdAt: serverLearning.createdAt,
    updatedAt: serverLearning.updatedAt
  }
}

export function normalizeRelationShip(serverRelationShip: any): RelationShipRecord {
  return {
    id: serverRelationShip._id,
    name: serverRelationShip.name,
    relationship: serverRelationShip.relationship ?? null,
    avatar_color: serverRelationShip.avatar_color ?? null,
    birthday: serverRelationShip.birthday ?? null,
    phone: serverRelationShip.phone ?? null,
    email: serverRelationShip.email ?? null,
    location: serverRelationShip.location ?? null,
    notes: serverRelationShip.notes ?? null,
    interests: serverRelationShip.interests ?? null,
    check_in_frequency: serverRelationShip.check_in_frequency ?? null,
    last_contact_date: serverRelationShip.last_contact_date ?? null,
    is_deleted: serverRelationShip.is_deleted ?? false,
    deleted_at: serverRelationShip.deleted_at ?? null,
    createdAt: serverRelationShip.createdAt,
    updatedAt: serverRelationShip.updatedAt
  }
}

export function normalizeMedicalDocument(serverDoc: any): MedicalDocumentRecord {
  return {
    id: serverDoc._id,
    title: serverDoc.title,
    description: serverDoc.description ?? null,
    date: serverDoc.date,
    type: serverDoc.type,
    file_url: serverDoc.file_url,
    file_name: serverDoc.file_name ?? null,
    file_size: serverDoc.file_size ?? null,
    file_type: serverDoc.file_type ?? null,
    is_archived: serverDoc.is_archived ?? false,
    is_deleted: serverDoc.is_deleted ?? false,
    deleted_at: serverDoc.deleted_at ?? null,
    deleted_by_process: serverDoc.deleted_by_process ?? null,
    createdAt: serverDoc.createdAt,
    updatedAt: serverDoc.updatedAt
  }
}

export function normalizeWorkout(serverWorkout: any): WorkoutRecord {
  return {
    id: serverWorkout._id,
    created_by: serverWorkout.created_by,
    type: serverWorkout.type,
    title: serverWorkout.title,
    duration_minutes: serverWorkout.duration_minutes ?? null,
    calories_burned: serverWorkout.calories_burned ?? null,
    date: serverWorkout.date,
    notes: serverWorkout.notes ?? null,
    exercises: (serverWorkout.exercises ?? []).map((ex: any) => ({
      name: ex.name,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      weight: ex.weight ?? null,
      distance: ex.distance ?? null,
      duration: ex.duration ?? null,
      notes: ex.notes ?? null
    })),
    is_deleted: serverWorkout.is_deleted ?? false,
    deleted_at: serverWorkout.deleted_at ?? null,
    deleted_by_process: serverWorkout.deleted_by_process ?? null,
    createdAt: serverWorkout.createdAt,
    updatedAt: serverWorkout.updatedAt
  }
}

export function normalizeWorkoutPlan(serverPlan: any): WorkoutPlanRecord {
  return {
    id: serverPlan._id,
    created_by: serverPlan.created_by,
    name: serverPlan.name,
    description: serverPlan.description ?? null,
    type: serverPlan.type,
    active: serverPlan.active ?? false,
    scheduled_days: serverPlan.scheduled_days ?? [],
    exercises: (serverPlan.exercises ?? []).map((ex: any) => ({
      name: ex.name,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      weight: ex.weight ?? null,
      distance: ex.distance ?? null,
      duration: ex.duration ?? null,
      rest_seconds: ex.rest_seconds ?? null,
      notes: ex.notes ?? null
    })),
    is_deleted: serverPlan.is_deleted ?? false,
    deleted_at: serverPlan.deleted_at ?? null,
    deleted_by_process: serverPlan.deleted_by_process ?? null,
    createdAt: serverPlan.createdAt,
    updatedAt: serverPlan.updatedAt
  }
}

export function normalizeBodyMeasurement(serverMeasurement: any): BodyMeasurementRecord {
  return {
    id: serverMeasurement._id,
    created_by: serverMeasurement.created_by,
    date: serverMeasurement.date,
    notes: serverMeasurement.notes ?? null,
    weight: serverMeasurement.weight ?? null,
    body_fat: serverMeasurement.body_fat ?? null,
    chest: serverMeasurement.chest ?? null,
    waist: serverMeasurement.waist ?? null,
    hips: serverMeasurement.hips ?? null,
    neck: serverMeasurement.neck ?? null,
    shoulders: serverMeasurement.shoulders ?? null,
    left_arm: serverMeasurement.left_arm ?? null,
    right_arm: serverMeasurement.right_arm ?? null,
    left_thigh: serverMeasurement.left_thigh ?? null,
    right_thigh: serverMeasurement.right_thigh ?? null,
    resting_heart_rate: serverMeasurement.resting_heart_rate ?? null,
    blood_pressure_systolic: serverMeasurement.blood_pressure_systolic ?? null,
    blood_pressure_diastolic: serverMeasurement.blood_pressure_diastolic ?? null,
    is_deleted: serverMeasurement.is_deleted ?? false,
    deleted_at: serverMeasurement.deleted_at ?? null,
    deleted_by_process: serverMeasurement.deleted_by_process ?? null,
    createdAt: serverMeasurement.createdAt,
    updatedAt: serverMeasurement.updatedAt
  }
}

export function normalizeProgressPhoto(serverPhoto: any): ProgressPhotoRecord {
  return {
    id: serverPhoto._id,
    created_by: serverPhoto.created_by,
    image_url: serverPhoto.image_url,
    date: serverPhoto.date,
    description: serverPhoto.description ?? null,
    body_area: serverPhoto.body_area ?? 'full_body',
    is_deleted: serverPhoto.is_deleted ?? false,
    deleted_at: serverPhoto.deleted_at ?? null,
    deleted_by_process: serverPhoto.deleted_by_process ?? null,
    is_archived: serverPhoto.is_archived ?? false,
    createdAt: serverPhoto.createdAt,
    updatedAt: serverPhoto.updatedAt,
    public_id: serverPhoto.public_id ?? null
  }
}

export function normalizeHobby(serverHobby: any): HobbyRecord {
  return {
    id: serverHobby._id,
    created_by: serverHobby.created_by,
    name: serverHobby.name,
    category: serverHobby.category ?? 'other',
    description: serverHobby.description ?? null,
    skill_level: serverHobby.skill_level ?? 'beginner',
    status: serverHobby.status ?? 'active',
    started_date: serverHobby.started_date ?? null,
    frequency: serverHobby.frequency ?? null,
    avg_session_minutes: serverHobby.avg_session_minutes ?? null,
    equipment: serverHobby.equipment ?? null,
    color: serverHobby.color ?? 'indigo',
    is_deleted: serverHobby.is_deleted ?? false,
    deleted_at: serverHobby.deleted_at ?? null,
    createdAt: serverHobby.createdAt,
    updatedAt: serverHobby.updatedAt
  }
}

export function normalizeBusiness(serverBusiness: any): BusinessRecord {
  return {
    id: serverBusiness._id,
    serverId: serverBusiness._id,
    created_by: serverBusiness.created_by,
    name: serverBusiness.name,
    description: serverBusiness.description ?? null,
    is_deleted: serverBusiness.is_deleted ?? false,
    deleted_at: serverBusiness.deleted_at ?? null,
    createdAt: serverBusiness.createdAt,
    updatedAt: serverBusiness.updatedAt
  }
}

export function normalizeIncome(server: any): IncomeRecord {
  return {
    id: server._id,
    serverId: server._id,
    title: server.title,
    amount: server.amount,
    date: server.date ?? null,
    category: server.category ?? null,
    business_id: server.business_id ?? null,
    bank_account_name: server.bank_account_name ?? null,
    notes: server.notes ?? '',
    is_recurring: server.is_recurring ?? false,
    frequency: server.frequency ?? null,
    start_date: server.start_date ?? null,
    is_deleted: server.is_deleted ?? false,
    deleted_at: server.deleted_at ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeExpense(server: any): ExpenseRecord {
  return {
    id: server._id,
    serverId: server._id,
    title: server.title ?? '',
    amount: Number(server.amount ?? 0),
    date: server.date ?? null,
    category: server.category ?? null,
    business_id: server.business_id ?? null,
    bank_account_name: server.bank_account_name ?? null,
    notes: server.notes ?? '',
    is_recurring: Boolean(server.is_recurring),
    frequency: server.frequency ?? null,
    start_date: server.start_date ?? null,
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeProblem(server: any): ProblemRecord {
  return {
    id: server._id,
    serverId: server._id,
    title: server.title ?? '',
    description: server.description ?? '',
    priority: server.priority ?? 'medium',
    business_id: server.business_id ?? null,
    goal_id: server.goal_id ?? null,
    resolved: Boolean(server.resolved),
    resolved_at: server.resolved_at ?? null,
    category: server.category ?? null,
    status: server.status ?? (server.resolved ? 'resolved' : 'active'),
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    date_occurred: server.date_occurred ?? null,
    date_ended: server.date_ended ?? null,
    important: Boolean(server.important),
    show_in_timeline: server.show_in_timeline ?? true,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeTimeEntry(server: any): TimeEntryRecord {
  return {
    id: server._id,
    serverId: server._id,
    date: server.date ?? '',
    start_time: server.start_time ?? '',
    end_time: server.end_time ?? null,
    duration: server.duration ?? null,
    description: server.description ?? '',
    notes: server.notes ?? null,
    section_id: server.section_id ?? null,
    client_id: server.client_id ?? null,
    project_id: server.project_id ?? null,
    is_running: Boolean(server.is_running),
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeProject(server: any): ProjectRecord {
  return {
    id: server._id,
    serverId: server._id,
    name: server.name ?? '',
    description: server.description ?? null,
    business_id: server.business_id ?? null,
    client_id: server.client_id ?? null,
    status: server.status ?? 'planning',
    start_date: server.start_date ?? null,
    deadline: server.deadline ?? null,
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    deleted_by_process: server.deleted_by_process ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeClient(server: any): ClientRecord {
  return {
    id: server._id,
    serverId: server._id,
    name: server.name ?? '',
    company: server.company ?? null,
    email: server.email ?? null,
    phone: server.phone ?? null,
    status: server.status ?? 'lead',
    notes: server.notes ?? null,
    business_id: server.business_id ?? null,
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    deleted_by_process: server.deleted_by_process ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeMarketingStrategy(server: any): MarketingStrategyRecord {
  return {
    id: server._id,
    serverId: server._id,
    name: server.name ?? '',
    main_goal: server.main_goal ?? null,
    smart_specific: server.smart_specific ?? null,
    smart_measurable: server.smart_measurable ?? null,
    smart_achievable: server.smart_achievable ?? null,
    smart_relevant: server.smart_relevant ?? null,
    smart_time_bound: server.smart_time_bound ?? null,
    target_audience: server.target_audience ?? null,
    usp: server.usp ?? null,
    core_message: server.core_message ?? null,
    main_channels: Array.isArray(server.main_channels) ? server.main_channels : [],
    notes: server.notes ?? null,
    status: server.status ?? 'draft',
    business_id: server.business_id ?? null,
    goal_id: server.goal_id ?? null,
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    deleted_by_process: server.deleted_by_process ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeMarketingCampaign(server: any): MarketingCampaignRecord {
  return {
    id: server._id,
    serverId: server._id,
    name: server.name ?? '',
    strategy_id: server.strategy_id ?? null,
    campaign_type: server.campaign_type ?? '',
    goal: server.goal ?? null,
    channel: server.channel ?? null,
    start_date: server.start_date ?? null,
    end_date: server.end_date ?? null,
    budget: server.budget ?? null,
    status: server.status ?? 'planned',
    kpis: Array.isArray(server.kpis)
      ? server.kpis.map((kpi: any) => ({
          name: kpi.name ?? '',
          target: kpi.target ?? '',
          actual: kpi.actual ?? ''
        }))
      : [],
    notes: server.notes ?? null,
    business_id: server.business_id ?? null,
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    deleted_by_process: server.deleted_by_process ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeMarketingContent(server: any): MarketingContentRecord {
  return {
    id: server._id,
    serverId: server._id,
    title: server.title ?? '',
    campaign_id: server.campaign_id ?? null,
    type: server.type ?? '',
    platform: server.platform ?? '',
    status: server.status ?? 'draft',
    publish_date: server.publish_date ?? null,
    cta: server.cta ?? null,
    asset_url: server.asset_url ?? null,
    description: server.description ?? null,
    notes: server.notes ?? null,
    business_id: server.business_id ?? null,
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    deleted_by_process: server.deleted_by_process ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeOfflineAccount(server: any): OfflineAccountRecord {
  return {
    id: server._id,
    serverId: server._id,
    created_by: server.created_by ?? '',
    name: server.name ?? '',
    balance: server.balance ?? 0,
    currency: server.currency ?? 'EUR',
    notes: server.notes ?? null,
    is_deleted: Boolean(server.is_deleted),
    deleted_at: server.deleted_at ?? null,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  }
}

export function normalizeNote(serverNote: any): NoteRecord {
  return {
    id: serverNote._id,
    serverId: serverNote._id,
    created_by: serverNote.created_by ?? '',
    category: serverNote.category ?? '',
    content: serverNote.content ?? '',
    business_id: serverNote.business_id ?? null,
    is_deleted: serverNote.is_deleted ?? false,
    deleted_at: serverNote.deleted_at ?? null,
    createdAt: serverNote.createdAt,
    updatedAt: serverNote.updatedAt
  }
}
