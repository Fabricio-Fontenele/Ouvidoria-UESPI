import { z } from 'zod'

export const signUpFormSchema = z
  .object({
    acceptedTerms: z.boolean().refine((acceptedTerms) => acceptedTerms, {
      message: 'Aceite os termos de uso para continuar.',
    }),
    confirmPassword: z.string().trim().min(1, 'Confirme sua senha.'),
    email: z.email('Informe um email válido.'),
    fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
    password: z.string().trim().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword'],
  })

export type SignUpFormData = z.infer<typeof signUpFormSchema>

export function getSignUpFormDefaultValues(): SignUpFormData {
  return {
    acceptedTerms: false,
    confirmPassword: '',
    email: '',
    fullName: '',
    password: '',
  }
}
