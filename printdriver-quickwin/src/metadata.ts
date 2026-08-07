import type { AppMetadata } from './utils.js'

const baseUrl = import.meta.url.substring(0, import.meta.url.lastIndexOf('/') + 1)
const metadataP = fetch(baseUrl + 'metadata.json?t=' + Date.now()).then(r => r.json()) as Promise<AppMetadata>
globalThis.__APP_METADATA__ = metadataP
