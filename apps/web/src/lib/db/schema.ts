import {
  pgTable, uuid, text, boolean, timestamp, date, integer, numeric, jsonb, index
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Users (synced from Clerk webhook) ───────────────────────
export const users = pgTable('users', {
  id:              uuid('id').primaryKey().defaultRandom(),
  clerkUserId:     text('clerk_user_id').unique().notNull(),
  email:           text('email').notNull(),
  name:            text('name'),
  // Early-access gate: new users start unapproved. Flipped to true when you
  // approve them in the Clerk dashboard (sets publicMetadata.approved=true,
  // synced here via the user.updated webhook + self-heal in getDbUser).
  approved:        boolean('approved').default(false).notNull(),
  approvedAt:      timestamp('approved_at'),
  onboardingDone:  boolean('onboarding_done').default(false),
  createdAt:       timestamp('created_at').defaultNow(),
}, (t) => [index('users_clerk_idx').on(t.clerkUserId)])

// ── Profiles (one per user) ──────────────────────────────────
export const profiles = pgTable('profiles', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  fullName:      text('full_name'),
  email:         text('email'),
  phone:         text('phone'),
  location:      text('location'),
  linkedin:      text('linkedin'),
  portfolioUrl:  text('portfolio_url'),
  github:        text('github'),
  timezone:      text('timezone'),
  compTarget:    text('comp_target'),
  compCurrency:  text('comp_currency').default('USD'),
  compMinimum:   text('comp_minimum'),
  locationFlex:  text('location_flex'),
  cvText:        text('cv_text'),
  cvUpdatedAt:   timestamp('cv_updated_at'),
  updatedAt:     timestamp('updated_at').defaultNow(),
})

// ── Target roles ─────────────────────────────────────────────
export const targetRoles = pgTable('target_roles', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleTitle:      text('role_title').notNull(),
  archetypeName:  text('archetype_name'),
  archetypeLevel: text('archetype_level'),
  fitType:        text('fit_type').default('primary'),
  sortOrder:      integer('sort_order').default(0),
})

// ── Portal config (companies to scan) ────────────────────────
export const portalsConfig = pgTable('portals_config', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  companyName:    text('company_name').notNull(),
  careersUrl:     text('careers_url'),
  provider:       text('provider'),
  apiUrl:         text('api_url'),
  enabled:        boolean('enabled').default(true),
  locationFilter: jsonb('location_filter'),
  createdAt:      timestamp('created_at').defaultNow(),
})

// ── Reports ──────────────────────────────────────────────────
export const reports = pgTable('reports', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  seqNum:          integer('seq_num'),
  company:         text('company'),
  role:            text('role'),
  jobUrl:          text('job_url'),
  score:           numeric('score', { precision: 3, scale: 1 }),
  archetype:       text('archetype'),
  legitimacyTier:  text('legitimacy_tier'),
  reportMd:        text('report_md'),
  blockA:          jsonb('block_a'),
  blockB:          jsonb('block_b'),
  blockC:          jsonb('block_c'),
  blockD:          jsonb('block_d'),
  blockE:          jsonb('block_e'),
  blockF:          jsonb('block_f'),
  blockG:          jsonb('block_g'),
  createdAt:       timestamp('created_at').defaultNow(),
})

// ── Applications ─────────────────────────────────────────────
export const applications = pgTable('applications', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  seqNum:       integer('seq_num'),
  appliedDate:  date('applied_date'),
  company:      text('company').notNull(),
  role:         text('role').notNull(),
  score:        numeric('score', { precision: 3, scale: 1 }),
  status:       text('status').notNull().default('evaluated'),
  pdfUrl:       text('pdf_url'),
  reportId:     uuid('report_id').references(() => reports.id),
  jobUrl:       text('job_url'),
  notes:        text('notes'),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
}, (t) => [index('apps_user_idx').on(t.userId)])

// ── Pipeline items (pending URL inbox) ───────────────────────
export const pipelineItems = pgTable('pipeline_items', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobUrl:       text('job_url').notNull(),
  companyHint:  text('company_hint'),
  roleHint:     text('role_hint'),
  status:       text('status').default('pending'),
  errorMsg:     text('error_msg'),
  reportId:     uuid('report_id').references(() => reports.id),
  createdAt:    timestamp('created_at').defaultNow(),
})

// ── Follow-ups ───────────────────────────────────────────────
export const followups = pgTable('followups', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  applicationId:   uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }),
  sentDate:        date('sent_date'),
  channel:         text('channel'),
  contact:         text('contact'),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').defaultNow(),
})

// ── Scan runs ────────────────────────────────────────────────
export const scanRuns = pgTable('scan_runs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startedAt:        timestamp('started_at').defaultNow(),
  completedAt:      timestamp('completed_at'),
  companiesScanned: integer('companies_scanned').default(0),
  jobsFound:        integer('jobs_found').default(0),
  jobsNew:          integer('jobs_new').default(0),
  status:           text('status').default('running'),
  logText:          text('log_text'),
})

// ── Scan results ─────────────────────────────────────────────
export const scanResults = pgTable('scan_results', {
  id:               uuid('id').primaryKey().defaultRandom(),
  scanRunId:        uuid('scan_run_id').references(() => scanRuns.id, { onDelete: 'cascade' }),
  userId:           uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  company:          text('company'),
  jobTitle:         text('job_title'),
  jobUrl:           text('job_url'),
  location:         text('location'),
  addedToPipeline:  boolean('added_to_pipeline').default(false),
  createdAt:        timestamp('created_at').defaultNow(),
})

// ── Interview prep ───────────────────────────────────────────
export const interviewPrep = pgTable('interview_prep', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  applicationId: uuid('application_id').references(() => applications.id),
  company:       text('company'),
  role:          text('role'),
  prepMd:        text('prep_md'),
  createdAt:     timestamp('created_at').defaultNow(),
})

// ── Story bank (STAR+R) ──────────────────────────────────────
export const storyBank = pgTable('story_bank', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title:       text('title'),
  situation:   text('situation'),
  task:        text('task'),
  action:      text('action'),
  result:      text('result'),
  reflection:  text('reflection'),
  tags:        text('tags').array(),
  createdAt:   timestamp('created_at').defaultNow(),
})

// ── Relations ────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  profile:      one(profiles, { fields: [users.id], references: [profiles.userId] }),
  applications: many(applications),
  reports:      many(reports),
  pipelineItems: many(pipelineItems),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user:      one(users, { fields: [applications.userId], references: [users.id] }),
  report:    one(reports, { fields: [applications.reportId], references: [reports.id] }),
  followups: many(followups),
}))

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
}))
