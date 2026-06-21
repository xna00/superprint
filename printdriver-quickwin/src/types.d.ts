declare global {
    namespace JSX {
        interface IntrinsicElements {
            w: {
                type?: string
                text?: string
                ws?: number
                disabled?: boolean
                visible?: boolean
                style?: Record<string, any>
                onEvent?: (e: { hwnd: number; msg: number; wParam: number; lParam: number }) => void
                children?: any
                ref?: any
            }
        }
    }
}

export {}
