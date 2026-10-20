/** 把 FpdfRotate 挂进 quickwin 的全局 EnumMap。
 *
 * 只挂 rotate：它的值域全列得出来（0..3）。位掩码类的参数挂不了——值域列不全，
 * A|B 会塌成 number 过不了 enum 类型检查，那些参数在 bind 签名里保持裸 i32。
 *
 * 用 declare global 而不是 declare module（见 quickwin lib/ffi/ctype.d.ts 的说明），
 * 直接合并 quickwin 那边声明的全局 EnumMap。
 */
import type { FpdfRotate } from './pdfium-enum.js'

declare global {
    interface EnumMap {
        FpdfRotate: FpdfRotate
    }
}
