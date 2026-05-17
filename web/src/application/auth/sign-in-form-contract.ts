import { z } from 'zod'

export const signInFormSchema = z.object({
  email: z.email('Informe um email válido.'),
  password: z.string().trim().min(1, 'Informe sua senha.'),
})

export type SignInFormData = z.infer<typeof signInFormSchema>

export function getSignInFormDefaultValues(): SignInFormData {
  return {
    email: '',
    password: '',
  }
}
