import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

class ApiKeyManager {
  private readonly secretKeyName: string
  private apiKey: string | undefined

  constructor() {
    if (!process.env.API_KEY_SECRET_NAME) {
      throw new Error('API_KEY_SECRET_NAME must be set, server side only')
    }
    this.secretKeyName = process.env.API_KEY_SECRET_NAME
  }

  async getApiKey() {
    if (this.apiKey) {
      return this.apiKey
    }

    const secretManagerClient = new SecretManagerServiceClient({})

    const request = { name: this.secretKeyName }
    const [version] = await secretManagerClient.accessSecretVersion(request)

    this.apiKey = version?.payload?.data?.toString('utf-8')
    return this.apiKey
  }
}

export const apiKeyManager = new ApiKeyManager()
