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

export type ProjectBasicInfoInput = z.infer<typeof projectBasicInfoSchema>
export type ProjectFundingInput = z.infer<typeof projectFundingSchema>
