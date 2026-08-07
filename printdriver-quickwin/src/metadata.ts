import { createDeferred } from './utils.js'
import type { AppMetadata } from './utils.js'

globalThis.__APP_METADATA__ = createDeferred<AppMetadata>()
