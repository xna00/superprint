import { findUserById } from "../models/db.ts";
import { getInfo } from "./global.ts";
import type { Info } from "./global.ts";
import { ApiError, decryptString } from "./utils.ts";

export const _currentUser = async (info: Info = getInfo()) => {
  const cookie = info.request.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  
  if (!tokenMatch) {
    throw new ApiError(401, {}, "未登录！");
  }
  
  const token = tokenMatch[1];
  
  try {
    const userId = await decryptString(token);
    const id = parseInt(userId);
    
    const u = findUserById(id);

    if (u) {
      return u;
    }
    throw new ApiError(401, {}, "未登录！");
  } catch (error) {
    throw new ApiError(401, {}, "未登录！");
  }
};

export const currentUser = async () => {
  const info = getInfo();
  return await _currentUser(info);
};
