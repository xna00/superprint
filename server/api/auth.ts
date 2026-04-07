import { User, WeixinKfUser, type UserBase, type UserInsert } from "../models/index.ts";
import { getInfo } from "./global.ts";
import {
  ApiError,
  assertApiError,
  succeed,
  encryptString,
  makeJsonResponse200,
} from "./utils.ts";
import { sendTextMessage } from "./weixin/send.ts";

export const login = async (user: Omit<UserInsert, 'id'> & { 
  weixinKfExternalUserId?: string,
  openKfId?: string 
}) => {
  const info = getInfo()
  const u = User.findOne({
    username: user.username,
    password: user.password,
  });
  console.log(u, user)


  if (u) {
    if (user.weixinKfExternalUserId) {
      const existingKfUser = WeixinKfUser.findOne({ 
        externalUserId: user.weixinKfExternalUserId 
      })
      
      if (!existingKfUser) {
        WeixinKfUser.insert([{
          externalUserId: user.weixinKfExternalUserId,
          userId: u.id,
        }])
        console.log('关联微信客服账号:', user.weixinKfExternalUserId)
      } else if (existingKfUser.userId !== u.id) {
        WeixinKfUser.update(
          { externalUserId: user.weixinKfExternalUserId },
          { userId: u.id }
        )
        console.log('更新微信客服账号关联:', user.weixinKfExternalUserId)
      }
      
      if (user.openKfId) {
        try {
          await sendTextMessage(
            `登录成功！欢迎 ${u.username}`,
            user.openKfId,
            user.weixinKfExternalUserId
          )
          console.log('✅ 欢迎消息发送成功')
        } catch (error) {
          console.error('❌ 发送欢迎消息失败:', error)
        }
      }
    }

    const token = await encryptString(u.id.toString())

    info.status = 200
    info.headers = {
      'Content-Type': 'application/json',
      'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict`,
    }

    return {
      id: u.id,
      username: u.username,
      token,
    }

  } else {
    throw new ApiError(400, {}, "用户名或密码错误！");
  }
};

export const register = (
  u: UserInsert
) => {
  User.insert([u]);
  return succeed;
};
