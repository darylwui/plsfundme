import { z } from 'zod'

export const projectBasicInfoSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  category_id: z.string().uuid('Please select a category'),
  short_description: z
    .string()
    .min(20, 'Summary must be at least 20 characters')
    .max(200, 'Summary must be 200 characters or fewer'),
  full_description: z.string().min(50, 'Description must be at least 50 characters'),
  cover_image_url: z.string().url().nullable().optional(),
  video_url: z.string().url('Must be a valid URL').nullable().optional(),
})

export const projectFundingSchema = z.object({
  funding_goal_sgd: z
    .number()
    .min(500, 'Minimum funding goal is S$500')
    .max(10_000_000, 'Maximum funding goal is S$10,000,000'),
  start_date: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime(),
  payout_mode: z.enum(['manual', 'automatic']),
}).refine(
  (data) => new Date(data.deadline) > new Date(),
  { message: 'Deadline must be in the future', path: ['deadline'] }
)

export const milestoneSchema = z.object({
  title: z
    .string()
    .min(5, 'Milestone title must be at least 5 characters')
    .max(80, 'Milestone title must be 80 characters or fewer'),
  description: z
    .string()
    .min(20, 'Describe the proof you\'ll submit (at least 20 characters)')
    .max(300, 'Description must be 300 characters or fewer'),
  target_date: z.string().min(1, 'Target date is required'),
})

export const projectMilestonesSchema = z
  .object({
    milestones: z.array(milestoneSchema).length(3, 'All 3 milestones are required'),
  })
  .superRefine((data, ctx) => {
    // Ensure each milestone's target date is in the future and strictly after the previous one.
    const now = Date.now()
    let prev = 0
    data.milestones.forEach((m, i) => {
      const ts = new Date(m.target_date).getTime()
      if (Number.isNaN(ts)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['milestones', i, 'target_date'],
          message: 'Invalid date',
        })
        return
      }
      if (ts < now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['milestones', i, 'target_date'],
          message: 'Target date must be in the future',
        })
      }
      if (i > 0 && ts <= prev) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['milestones', i, 'target_date'],
          message: 'Must come after the previous milestone',
        })
      }
      prev = ts
    })
  })

export type ProjectBasicInfoInput = z.infer<typeof projectBasicInfoSchema>
export type ProjectFundingInput = z.infer<typeof projectFundingSchema>
export type MilestoneInput = z.infer<typeof milestoneSchema>
export type ProjectMilestonesInput = z.infer<typeof projectMilestonesSchema>
