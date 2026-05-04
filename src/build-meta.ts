export const ENGINE_VERSION = process.env.NEXT_PUBLIC_ENGINE_VERSION ?? 'dev'
export const SKILLS_COMMIT = process.env.NEXT_PUBLIC_SKILLS_COMMIT ?? 'dev'
export const SKILLS_DATE = process.env.NEXT_PUBLIC_SKILLS_DATE ?? new Date().toISOString()
export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT ?? 'dev'
export const APP_BUILD_TIME = process.env.NEXT_PUBLIC_APP_BUILD_TIME ?? new Date().toISOString()
