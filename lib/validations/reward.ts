import { z } from 'zod'

export const rewardSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(80),
  description: z.string().max(500).optional(),
  minimum_pledge_sgd: z
    .number()
    .min(1, 'Minimum pledge must be at least S$1'),
  estimated_delivery_date: z
    .string()
    .refine((d) => !d || new Date(d) > new Date(), {
      message: 'Delivery date must be in the future',
    })
    .optional(),
  max_backers: z.number().int().min(1).nullable().optional(),
  includes_physical_item: z.boolean().default(false),
})

export type RewardInput = z.infer<typeof rewardSchema>
