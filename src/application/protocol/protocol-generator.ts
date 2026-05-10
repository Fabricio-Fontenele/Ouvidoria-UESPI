export interface ProtocolGenerator {
  generate(): Promise<string>
}
