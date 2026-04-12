export * as weixin from "./weixin/index.ts";
export * as auth from "./auth.ts";
export * as user from "./user.ts";
export * as printJob from "./printJob.ts";
export * as files from "./files.ts";
export * as computer from "./computer.ts";
export * as version from "./version.ts";
export * as uploadStatic from "./uploadStatic.ts";

export const _outhello = (req: Request) => {
  console.log(req);
  return {
    message: "hello world",
  };
};
