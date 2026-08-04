import { getAccessToken } from './token.ts'
import {
  findWeixinKfById,
  insertWeixinKf,
  updateWeixinKfBaseLink,
} from '../../models/db.ts'
import { logger } from "../../logger.ts"

export const PRINT_MAN_KF_OPEN_ID = 'wkHnU4FQAAnkssZ2Y0t7gAKpQxcw7gjQ'
export const DOCUMENT_KF_OPEN_ID = 'wkHnU4FQAAIMj9uECzdKwOI_kRP_IGDQ'

const KF_LINK_SCENE = 'printer'

let inFlight: Promise<string> | null = null

export const getKfBaseLink = async (openKfId: string): Promise<string> => {
  const existing = findWeixinKfById(openKfId)
  if (existing?.kfBaseLink) return existing.kfBaseLink

  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const accessToken = await getAccessToken()
      const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/add_contact_way?access_token=${accessToken}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ open_kfid: openKfId, scene: KF_LINK_SCENE }),
      })
      const data = await response.json() as { errcode: number; errmsg: string; url: string }
      if (data.errcode !== 0) {
        throw new Error(`获取客服链接失败: ${data.errmsg} (errcode: ${data.errcode})`)
      }
      const kf = findWeixinKfById(openKfId)
      if (kf) {
        updateWeixinKfBaseLink(openKfId, data.url)
      } else {
        insertWeixinKf(openKfId, '', data.url)
      }
      logger.log(`已生成客服基础链接: openKfId=${openKfId}`)
      return data.url
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}
