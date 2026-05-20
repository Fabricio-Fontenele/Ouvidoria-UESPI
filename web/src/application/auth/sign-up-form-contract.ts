import { z } from 'zod'

const passwordComplexityPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const fullNamePattern = /^\S+ \S+(?: \S+)*$/

export const signUpFormSchema = z
  .object({
    acceptedTerms: z.boolean().refine((acceptedTerms) => acceptedTerms, {
      message: 'Aceite os termos de uso para continuar.',
    }),
    confirmPassword: z.string().trim().min(1, 'Confirme sua senha.'),
    email: z.email('Informe um email válido.'),
    fullName: z
      .string()
      .trim()
      .min(5, 'Informe nome e sobrenome.')
      .regex(fullNamePattern, 'Informe nome e sobrenome separados por um espaço.'),
    password: z
      .string()
      .trim()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .regex(passwordComplexityPattern, 'A senha deve conter uma letra maiúscula, uma minúscula e um número.'),
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
