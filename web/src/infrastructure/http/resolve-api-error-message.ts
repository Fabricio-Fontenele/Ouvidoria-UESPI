import { ApiHttpError } from './api-error'

/**
 * Maps backend error codes (`ApiHttpError.code`, which mirrors the server's
 * `error.name`) to friendly Portuguese messages. The server messages are
 * technical English strings that must never reach the UI — so anything not
 * listed here falls back to the caller-provided contextual message instead of
 * leaking `error.message`.
 */
const MESSAGES_BY_CODE: Record<string, string> = {
  // Conectividade
  NetworkError: 'Falha de conexão. Verifique sua internet e tente novamente.',

  // Autenticação e conta
  InvalidCredentialsError: 'E-mail ou senha incorretos.',
  EmailNotVerifiedError: 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.',
  EmailAlreadyVerifiedError: 'Este e-mail já foi confirmado. Faça login normalmente.',
  InvalidEmailVerificationCodeError: 'Código de confirmação inválido.',
  EmailVerificationCodeExpiredError: 'O código de confirmação expirou. Solicite um novo.',
  InvalidPasswordResetCodeError: 'Código de redefinição inválido.',
  PasswordResetCodeExpiredError: 'O código de redefinição expirou. Solicite um novo.',
  UserAlreadyExistsError: 'Já existe uma conta com este e-mail.',
  UserNotFoundError: 'Conta não encontrada.',
  InvalidEmailError: 'Informe um e-mail válido.',
  InvalidPasswordError: 'A senha não atende aos requisitos mínimos.',
  InvalidNameError: 'Informe um nome válido.',

  // Sessão e permissões
  UnauthenticatedError: 'Sua sessão expirou. Faça login novamente.',
  NotAllowedToAccessManifestationError: 'Você não tem permissão para acessar esta manifestação.',
  NotAllowedToManageManifestationError: 'Você não tem permissão para gerenciar esta manifestação.',

  // Manifestações
  ManifestationNotFoundError: 'Manifestação não encontrada.',
  ManifestationTrackingNotFoundError: 'Não encontramos uma manifestação com o protocolo e código informados.',
  ManifestationStatusTransitionNotAllowedError: 'Esta ação não é permitida no status atual da manifestação.',
  ManifestationInteractionNotAllowedError: 'Esta manifestação não permite novas interações no momento.',
  ManifestationCannotReceiveAttachmentsError: 'Esta manifestação não pode mais receber anexos.',
  ManifestationAlreadyEvaluatedError: 'Esta manifestação já foi avaliada.',
  ManifestationNotFinalizedError: 'A manifestação ainda não foi finalizada.',
  ManifestationHasNoAttendantError: 'A manifestação ainda não tem um atendente responsável.',
  CancellationReasonRequiresNoteError: 'Descreva o motivo do cancelamento para continuar.',

  // Anexos
  AttachmentFileTooLargeError: 'O arquivo excede o tamanho máximo permitido.',
  AttachmentMimeTypeNotAllowedError: 'Tipo de arquivo não permitido.',
  AttachmentFileEmptyError: 'O arquivo está vazio.',
  AttachmentNotFoundError: 'Anexo não encontrado.',
  ManifestationAttachmentsLimitExceededError: 'Limite de anexos atingido para esta manifestação.',

  // Catálogo (campus / setores)
  CampusNotFoundError: 'Campus não encontrado.',
  CampusInactiveError: 'O campus selecionado está inativo.',
  AdministrativeUnitNotFoundError: 'Setor administrativo não encontrado.',
  AdministrativeUnitInactiveError: 'O setor administrativo selecionado está inativo.',
  AdministrativeUnitDoesNotBelongToCampusError: 'O setor selecionado não pertence ao campus informado.',
  ForwardTargetUnitNotFoundError: 'Setor de destino não encontrado.',
  ForwardTargetUnitInactiveError: 'O setor de destino está inativo.',

  // IA
  AiServiceError: 'O assistente está indisponível no momento. Tente novamente em instantes.',
}

/**
 * Resolves a user-facing Portuguese message for an error caught from the API.
 *
 * Known backend error codes get a specific message; everything else (unknown
 * codes, generic `HttpErrorXXX`/`ServerError`, non-`Error` values) gets the
 * caller-provided contextual fallback. The raw backend `message` is never
 * surfaced.
 */
export function resolveApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiHttpError) {
    return MESSAGES_BY_CODE[error.code] ?? fallback
  }

  return fallback
}
