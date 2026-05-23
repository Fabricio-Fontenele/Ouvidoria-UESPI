import { z } from 'zod'

const historyMessageSchema = z.object({
  role: z.enum(['assistant', 'user']),
  content: z.string().trim().min(1).max(4000),
})

const campusSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
})

const administrativeUnitSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  campusId: z.string().min(1),
  description: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
})

const userRoleSchema = z
  .enum(['manifestant', 'ombudsman', 'admin'])
  .nullable()
  .optional()
  .transform((value) => value ?? null)

export const sendAiMessageBodySchema = z.object({
  history: z.array(historyMessageSchema).max(20),
  message: z.string().trim().min(1).max(4000),
  userRole: userRoleSchema,
  campuses: z.array(campusSchema).max(200),
  administrativeUnits: z.array(administrativeUnitSchema).max(2000),
})

export type SendAiMessageBody = z.infer<typeof sendAiMessageBodySchema>
