/** FPDF_RenderPageBitmap 的参数值域，取自 fpdfview.h。
 *
 * rotate 的值域就 4 个、全列得出来，所以挂进 EnumMap 做值域检查
 * （注册见 pdfium-enum-map.d.ts，bind 签名写 i32@FpdfRotate）——传 4 以外的数字编译期就报错。
 *
 * FpdfRenderFlag 是位掩码，值域列不全（A|B 会塌成 number，过不了 enum 类型检查），
 * 不进 EnumMap，bind 签名保持裸 i32，这里只当命名常量用。
 */

/** rotate：0 正常 / 1 顺时针 90° / 2 180° / 3 逆时针 90°。PDFium 自己做旋转。 */
export const enum FpdfRotate {
    NORMAL = 0,
    CW90 = 1,
    CW180 = 2,
    CCW90 = 3,
}

/** 渲染开关位掩码。废弃的 FPDF_DEBUG_INFO(0x80)、FPDF_NO_CATCH(0x100) 故意不列。 */
export const enum FpdfRenderFlag {
    NONE = 0,
    ANNOT = 0x1,                        // 渲染注释
    LCD_TEXT = 0x2,                     // LCD 子像素文字优化
    NO_NATIVETEXT = 0x4,                // 光栅文字替代原生文字
    GRAYSCALE = 0x8,                    // 灰阶渲染
    // ⚠️ 字节序翻成 R,G,B,X，与 BI_RGB 的 B,G,R,X 正好相反，打印出来蓝红互换、青变黄。
    // 98aec6d 就是把它误当打印旗子塞进来的。
    REVERSE_BYTE_ORDER = 0x10,
    CONVERT_FILL_TO_STROKE = 0x20,      // 填充转描边
    RENDER_LIMITEDIMAGECACHE = 0x200,   // 限制图像缓存
    RENDER_FORCEHALFTONE = 0x400,       // 强制半色调
    PRINTING = 0x800,                   // 打印质量：图像重采样 + 文字 hinting
    RENDER_NO_SMOOTHTEXT = 0x1000,
    RENDER_NO_SMOOTHIMAGE = 0x2000,
    RENDER_NO_SMOOTHPATH = 0x4000,
}
