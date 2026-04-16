import { gzipSync } from "node:zlib";
import { WECOM_ENCODING_AES_KEY } from "./constants.ts";

export const addTokenToUrl = async (url: string, userId: number): Promise<string> => {
  const parsedUrl = new URL(url)
  const token = await encryptString(userId.toString())
  parsedUrl.searchParams.set('token', token)
  return parsedUrl.toString()
}

export const succeed = {
  succeed: true,
};

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const getKey = async () => {
  const keyData = Buffer.from(WECOM_ENCODING_AES_KEY, 'base64')
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

export const encryptString = async (text: string): Promise<string> => {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = encoder.encode(text)
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  return Buffer.from(combined).toString('base64')
}

export const decryptString = async (encryptedText: string): Promise<string> => {
  const key = await getKey()
  const data = Buffer.from(encryptedText, 'base64')
  
  const iv = data.subarray(0, 12)
  const encrypted = data.subarray(12)
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  )
  
  return decoder.decode(decrypted)
}

export class ApiError extends Error {
  public status: number;
  public headers: ResponseInit["headers"];
  public errorCode?: string;
  constructor(
    status: number,
    headers: ResponseInit["headers"],
    message: string,
    errorCode?: string
  ) {
    super(message);
    this.status = status;
    this.headers = headers;
    this.errorCode = errorCode;
  }
}

export const makeJsonResponse = (
  status: number,
  _headers: ResponseInit["headers"],
  obj: object
): Response => {
  const bodyStr = JSON.stringify(obj);
  const e = new TextEncoder();
  let body = e.encode(bodyStr);

  const headers = new Headers(_headers);
  headers.delete("content-type");
  headers.delete("content-length");


  headers.set("content-type", "application/json");
  headers.set("content-length", body.length.toString());

  return new Response(body, { status, headers });
};

export const makeJsonResponse200 = makeJsonResponse.bind(null, 200);

/**
 *
 * @description Assert v is not undefined, or throw an ApiError.
 */
export const assertApiError: <T>(
  v: T,
  msg: string,
  status?: number
) => asserts v is Exclude<T, undefined> = (v, msg, status = 500) => {
  if (v === undefined) {
    throw new ApiError(status, {}, msg);
  }
};

export type FirstParam<T extends (...args: any) => any> = Parameters<T>[0];

export type OmitFrom<T, K extends keyof T> = Omit<T, K>;
