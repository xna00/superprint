export const API_BASE_URLS = [
    'https://superprint6.xna00.top',
    'https://superprint.xna00.top',
]

export const WS_URLS = [
    'wss://superprint6.xna00.top/ws/print',
    'wss://superprint.xna00.top/ws/print',
]

export const API_BASE_URL = 'https://superprint.xna00.top'

export const API_USER_CURRENT = API_BASE_URL + '/api/user/currentUser'
export const API_LOGIN = API_BASE_URL + '/api/auth/login'
export const API_LIST_PRINTTASKS = API_BASE_URL + '/api/printTask/listPrintTasks'
export const API_GET_FILE = API_BASE_URL + '/api/files/getFile'
export const API_GET_PS_FILE = API_BASE_URL + '/api/files/getPsFile'
export const API_FILE_SUCCEED = API_BASE_URL + '/api/printTask/fileSucceed'
export const API_FILE_FAILED = API_BASE_URL + '/api/printTask/fileFailed'
export const API_COMPUTER_INFO = API_BASE_URL + '/api/computer/computerInfo'
export const API_SET_COMPUTER_NAME = API_BASE_URL + '/api/computer/setComputerName'
export const API_ADD_COMPUTER = API_BASE_URL + '/api/computer/addComputer'
export const API_ADD_PRINTER = API_BASE_URL + '/api/computer/addComputerPrinter'
export const API_REMOVE_PRINTER = API_BASE_URL + '/api/computer/removeComputerPrinter'

export const COOKIE_FILE = 'cookie.txt'
export const DOWNLOAD_FOLDER = 'downloads'

export const WS_RECONNECT_DELAY_MIN = 10000
export const WS_RECONNECT_DELAY_MAX = 30000
export const WS_TIMEOUT = 60000

export const PROJECT_VERSION = '1.0.0'
