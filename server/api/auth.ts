import {
  findUserByUsernamePassword,
  insertUser,
  findWeixinKfUserByExternalUserId,
  insertWeixinKfUser,
  updateWeixinKfUserUserId,
  type UserInsert,
} from "../models/db.ts";
import { getInfo } from "./global.ts";
import {
  ApiError,
  assertApiError,
  succeed,
  encryptString,
  makeJsonResponse200,
} from "./utils.ts";
import { sendTextMessage } from "./weixin/send.ts";
import { logger } from "../logger.ts";

export const login = async (user: Omit<UserInsert, 'id'> & { 
  weixinKfExternalUserId?: string,
  openKfId?: string 
}) => {
  const info = getInfo()
  const u = findUserByUsernamePassword(
    user.username,
    user.password,
  );
  if (!u) {
    throw new ApiError(400, {}, "用户名或密码错误！");
  }

  if (user.weixinKfExternalUserId) {
    const existingKfUser = findWeixinKfUserByExternalUserId(
      user.weixinKfExternalUserId,
    )
    
    if (!existingKfUser) {
      insertWeixinKfUser(
        user.weixinKfExternalUserId,
        u.id,
      )
      logger.log('关联微信客服账号:', user.weixinKfExternalUserId)
    } else if (existingKfUser.userId !== u.id) {
      updateWeixinKfUserUserId(
        user.weixinKfExternalUserId,
        u.id
      )
      logger.log('更新微信客服账号关联:', user.weixinKfExternalUserId)
    }
    
    if (user.openKfId) {
      try {
        await sendTextMessage(
          `登录成功！欢迎 ${u.username}`,
          user.openKfId,
          user.weixinKfExternalUserId
        )
        logger.log('✅ 欢迎消息发送成功')
      } catch (error) {
        logger.error('❌ 发送欢迎消息失败:', error)
      }
    }
  }

  const token = await encryptString(u.id.toString())

  info.status = 200
  info.headers = {
    'Content-Type': 'application/json',
    'Set-Cookie': `token=${token}; Path=/; SameSite=Strict`,
  }

  return {
    id: u.id,
    username: u.username,
    token,
  }
};

export const register = (
  u: UserInsert
) => {
  insertUser(u.username, u.password, u.email ?? null);
  return succeed;
};
