import { http, HttpResponse } from 'msw'

export const healthHandlers = [
  http.get('*/health', () => {
    return HttpResponse.json({
      status: 'ok',
      components: {
        postgres: 'ok',
        redis: 'ok',
        nats: 'ok',
        victoriametrics: 'ok',
      },
    })
  }),
]
