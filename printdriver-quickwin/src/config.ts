export const API_BASE_URLS = [
    'https://superprint6.xna00.top/api',
    'https://superprint.xna00.top/api',
]

export const WS_URLS = [
    'wss://superprint6.xna00.top/ws/print',
    'wss://superprint.xna00.top/ws/print',
]

export const API_BASE_URL = 'https://superprint.xna00.top/api'

export const STORAGE_FILE = 'storage.json'
export const DOWNLOAD_FOLDER = 'downloads'

export const WS_RECONNECT_DELAY_MIN = 10000
export const WS_RECONNECT_DELAY_MAX = 30000
export const WS_TIMEOUT = 60000

export const RENDER_DPI = 300

export const PROJECT_VERSION = '1.0.0'
export const ENTRY_HASH = '__ENTRY_HASH__'

declare const __BUILD_TIME__: string
export const BUILD_TIME = __BUILD_TIME__
