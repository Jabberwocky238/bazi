export interface Env {
  ASSETS: Fetcher
}

export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
