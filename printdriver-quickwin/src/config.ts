export const API_BASE_URLS = [
    'https://superprint6.xna00.top/api',
    'https://superprint.xna00.top/api',
]

export const WS_URLS = [
    'wss://superprint6.xna00.top/ws/print',
    'wss://superprint.xna00.top/ws/print',
]

export const STORAGE_FILE = 'storage.json'

export const WS_RECONNECT_DELAY_MIN = 10000
export const WS_RECONNECT_DELAY_MAX = 30000
export const WS_TIMEOUT = 60000

export const RENDER_DPI = 600

export const ENTRY_HASH = '__ENTRY_HASH__'

declare const __BUILD_TIME__: string
export const BUILD_TIME = __BUILD_TIME__
