import { z } from 'zod'

export const createPledgeSchema = z.object({
  project_id: z.string().uuid(),
  reward_id: z.string().uuid().nullable(),
  amount_sgd: z
    .number()
    .min(1, 'Minimum pledge is S$1')
    .max(100_000, 'Maximum single pledge is S$100,000'),
  payment_method: z.enum(['card', 'paynow']),
  is_anonymous: z.boolean().default(false),
  backer_note: z.string().max(500).nullable().optional(),
})

export type CreatePledgeInput = z.infer<typeof createPledgeSchema>
