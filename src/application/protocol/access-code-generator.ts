export interface AccessCodeGenerator {
  generate(): Promise<string>
}
