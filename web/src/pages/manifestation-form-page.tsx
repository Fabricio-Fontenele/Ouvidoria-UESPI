import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AppHeader } from '../components/app-header'
import { BaseForm } from '../components/base-form'
import type { BaseFormField } from '../components/base-form'
import { SiteFooter } from '../components/site-footer'

type ManifestationFormMode = 'create' | 'edit'

interface ManifestationFormState {
  protocol: string | null
  mode: ManifestationFormMode
}

const manifestationTypes = ['Denúncia', 'Reclamação', 'Solicitação', 'Sugestão', 'Elogio']
const manifestationAreas = [
  'Administração Superior',
  'Coordenação de Curso',
  'Biblioteca',
  'Assistência Estudantil',
  'Outro setor',
]

const identificationOptions = [
  { label: 'Manifestação identificada', value: 'identified' },
  { label: 'Manifestação anônima', value: 'anonymous' },
]

const MAX_ATTACHMENT_COUNT = 5
const MAX_ATTACHMENT_SIZE_IN_BYTES = 5 * 1024 * 1024

const manifestationFormSchema = z.object({
  area: z
    .string()
    .min(1, 'Selecione a área responsável.')
    .refine((value) => manifestationAreas.includes(value), 'Selecione uma área válida.'),
  attachments: z
    .custom<FileList>()
    .optional()
    .refine((files) => files === undefined || files.length <= MAX_ATTACHMENT_COUNT, {
      message: `Envie no máximo ${MAX_ATTACHMENT_COUNT} arquivos.`,
    })
    .refine(
      (files) => files === undefined || Array.from(files).every((file) => file.size <= MAX_ATTACHMENT_SIZE_IN_BYTES),
      'Cada arquivo deve ter até 5 MB.',
    ),
  description: z
    .string()
    .trim()
    .min(20, 'Descreva a manifestação com pelo menos 20 caracteres.')
    .max(4000, 'A descrição deve ter no máximo 4000 caracteres.'),
  identification: z
    .string()
    .min(1, 'Selecione a forma de identificação.')
    .refine((value) => identificationOptions.some((option) => option.value === value), {
      message: 'Selecione uma forma de identificação válida.',
    }),
  manifestationType: z
    .string()
    .min(1, 'Selecione o tipo de manifestação.')
    .refine((value) => manifestationTypes.includes(value), 'Selecione um tipo válido.'),
  title: z
    .string()
    .trim()
    .min(5, 'Informe um título com pelo menos 5 caracteres.')
    .max(120, 'O título deve ter no máximo 120 caracteres.'),
})

type ManifestationFormData = z.infer<typeof manifestationFormSchema>

const manifestationFormFields: BaseFormField<ManifestationFormData>[] = [
  {
    kind: 'select',
    label: 'Tipo de manifestação',
    name: 'manifestationType',
    options: manifestationTypes.map((type) => ({ label: type, value: type })),
  },
  {
    kind: 'select',
    label: 'Área responsável',
    name: 'area',
    options: manifestationAreas.map((area) => ({ label: area, value: area })),
  },
  {
    helper: 'Use uma frase curta que resuma o assunto.',
    kind: 'text',
    label: 'Título',
    name: 'title',
    placeholder: 'Ex.: Ampliação do horário da biblioteca',
  },
  {
    kind: 'select',
    label: 'Identificação',
    name: 'identification',
    options: identificationOptions,
  },
  {
    helper: 'Inclua datas, locais, pessoas ou documentos relevantes quando houver.',
    kind: 'textarea',
    label: 'Descrição',
    name: 'description',
    placeholder: 'Descreva sua manifestação com detalhes suficientes para análise.',
    span: 'full',
  },
  {
    accept: 'image/*,.pdf,.doc,.docx',
    helper: 'Envie documentos ou imagens que ajudem na análise.',
    kind: 'file',
    label: 'Anexos',
    maxFileSizeInBytes: MAX_ATTACHMENT_SIZE_IN_BYTES,
    maxFiles: MAX_ATTACHMENT_COUNT,
    multiple: true,
    name: 'attachments',
    placeholder: 'Clique para anexar arquivos',
    span: 'full',
  },
]

function resolveFormState(): ManifestationFormState {
  const searchParams = new URLSearchParams(window.location.search)
  const protocol = searchParams.get('protocol')

  if (protocol !== null && protocol.trim() !== '') {
    return {
      mode: 'edit',
      protocol: protocol.startsWith('#') ? protocol : `#${protocol}`,
    }
  }

  return {
    mode: 'create',
    protocol: null,
  }
}

function getDefaultValues(isEditing: boolean): ManifestationFormData {
  if (isEditing) {
    return {
      area: 'Administração Superior',
      attachments: undefined,
      description:
        'Solicito a avaliação da possibilidade de ampliação dos horários de funcionamento da Biblioteca Central.',
      identification: 'identified',
      manifestationType: 'Sugestão',
      title: 'Solicitação de Ampliação de Horários na Biblioteca Central',
    }
  }

  return {
    area: '',
    attachments: undefined,
    description: '',
    identification: 'identified',
    manifestationType: '',
    title: '',
  }
}

export function ManifestationFormPage() {
  const { mode, protocol } = resolveFormState()
  const isEditing = mode === 'edit'
  const [status, setStatus] = useState<'error' | 'success' | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | undefined>()
  const form = useForm<ManifestationFormData>({
    defaultValues: getDefaultValues(isEditing),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(manifestationFormSchema),
  })

  const handleInvalidSubmit: SubmitErrorHandler<ManifestationFormData> = () => {
    setStatus('error')
    setStatusMessage('Não foi possível enviar. Corrija os campos indicados e tente novamente.')
  }

  const handleSubmit: SubmitHandler<ManifestationFormData> = () => {
    setStatus('success')
    setStatusMessage(
      isEditing
        ? 'Alterações preparadas com sucesso. A integração com o backend poderá enviar estes dados.'
        : 'Manifestação preparada com sucesso. A integração com o backend poderá registrar estes dados.',
    )
  }

  return (
    <div className="min-h-svh bg-landing-surface font-sans text-landing-text">
      <AppHeader isAuthenticated />

      <main className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-8 md:pt-14 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm leading-5 font-black tracking-[0.1em] text-landing-blue uppercase">
            {isEditing ? 'Editar manifestação' : 'Nova manifestação'}
          </p>
          <h1 className="mt-3 text-[38px] leading-none font-black text-landing-text sm:text-5xl">
            {isEditing ? protocol : 'Registrar manifestação'}
          </h1>
          <p className="mt-4 text-base leading-7 text-landing-brown">
            {isEditing
              ? 'Revise os campos da manifestação antes de enviar uma atualização para a Ouvidoria.'
              : 'Preencha as informações principais para que a Ouvidoria possa entender e encaminhar sua manifestação.'}
          </p>
        </div>

        <BaseForm
          cancelHref={
            isEditing && protocol !== null
              ? `/manifestation?protocol=${protocol.replace('#', '')}`
              : '/guarapi?mode=new'
          }
          fields={manifestationFormFields}
          form={form}
          onInvalid={handleInvalidSubmit}
          onSubmit={handleSubmit}
          status={status}
          statusMessage={statusMessage}
          submitLabel={isEditing ? 'Salvar alterações' : 'Enviar manifestação'}
        />
      </main>

      <SiteFooter />
    </div>
  )
}
