import type { Ref } from 'quickwin/lib/preact/preact.js'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            w: {
                type?: 'button' | 'edit' | 'static' | 'checkbox' | 'groupbox' | 'combobox' | 'listbox' | 'progressbar'
                text?: string
                value?: string
                disabled?: boolean
                visible?: boolean
                style?: Record<string, any>
                onEvent?: (e: { hwnd: number; msg: number; wParam: number; lParam: number }) => void
                placeholder?: string
                password?: boolean
                checked?: boolean
                items?: string[]
                max?: number
                children?: any
                ref?: Ref<number>
            }
        }
    }
}

export {}
