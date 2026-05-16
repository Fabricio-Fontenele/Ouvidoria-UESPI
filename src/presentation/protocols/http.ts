export interface AuthenticatedUser {
  id: string
  role: string
}

export interface HttpRequest<
  TBody = unknown,
  TParams = Record<string, string>,
  TQuery = Record<string, string | undefined>,
> {
  body: TBody
  params: TParams
  query: TQuery
  headers: Record<string, string | string[] | undefined>
  user?: AuthenticatedUser
}

export interface HttpResponse<TBody = unknown> {
  statusCode: number
  body: TBody
}
