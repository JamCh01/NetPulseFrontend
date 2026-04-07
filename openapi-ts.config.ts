import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'openapi.json',
  output: {
    path: 'src/api/generated',
    format: 'prettier',
  },
  client: '@hey-api/client-fetch',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
  ],
})
