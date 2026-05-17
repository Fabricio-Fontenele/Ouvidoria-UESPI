import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import {
  buildGuarapiNewManifestationHref,
  buildManifestationDetailsHref,
  getSearchParams,
  normalizeProtocol,
} from '../app/routes'
import {
  getManifestationFormDefaultValues,
  manifestationAreas,
  manifestationAttachmentLimits,
  manifestationFormSchema,
  manifestationIdentificationOptions,
  manifestationTypes,
} from '../application/manifestations/manifestation-form-contract'
import type { ManifestationFormData } from '../application/manifestations/manifestation-form-contract'
import { BaseForm } from '../components/forms/base-form'
import type { BaseFormField } from '../components/forms/base-form'
import { AppHeader } from '../components/layout/app-header'
import { SiteFooter } from '../components/layout/site-footer'

type ManifestationFormMode = 'create' | 'edit'

interface ManifestationFormState {
  protocol: string | null
  mode: ManifestationFormMode
}

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
    options: manifestationIdentificationOptions,
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
    maxFileSizeInBytes: manifestationAttachmentLimits.maxFileSizeInBytes,
    maxFiles: manifestationAttachmentLimits.maxFiles,
    multiple: true,
    name: 'attachments',
    placeholder: 'Clique para anexar arquivos',
    span: 'full',
  },
]

function resolveFormState(): ManifestationFormState {
  const searchParams = getSearchParams()
  const protocol = searchParams.get('protocol')

  if (protocol !== null && protocol.trim() !== '') {
    return {
      mode: 'edit',
      protocol: normalizeProtocol(protocol),
    }
  }

  return {
    mode: 'create',
    protocol: null,
  }
}

export function ManifestationFormPage() {
  const { mode, protocol } = resolveFormState()
  const isEditing = mode === 'edit'
  const [status, setStatus] = useState<'error' | 'success' | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | undefined>()
  const form = useForm<ManifestationFormData>({
    defaultValues: getManifestationFormDefaultValues(isEditing),
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
              ? buildManifestationDetailsHref(protocol)
              : buildGuarapiNewManifestationHref()
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
