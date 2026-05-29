import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'
import { configureApiClient } from '@/api/client'
import i18n from '@/i18n'

beforeAll(() => {
  configureApiClient()
  i18n.changeLanguage('zh')
  server.listen({ onUnhandledRequest: 'warn' })
})
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())
