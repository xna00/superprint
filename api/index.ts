import type { Api } from "../server";

const isGetMethod = (path: string) =>
  !!path.split("/").pop()?.startsWith("get");

export const createHandler = (base: string, options?: {
  beforeRequest?: (req: Request) => Promise<Request>;
  beforeResponse?: (res: Response) => Promise<Response>;
}): Promisify<Api> => {
  return new Proxy(() => { }, {
    get(_target, p: string, _receiver) {
      let ret = createHandler(`${base}/${p as string}`, options);
      if (p === "makeRequest") {
        ret = createHandler(`${base}`, options);
        // @ts-ignore
        ret.isMakeRequest = true;
      }
      return ret;
    },
    apply(target: any, _thisArg, argArray) {
      const isGet = isGetMethod(base);
      const req = new Request(
        isGet
          ? `${base}?data=${encodeURIComponent(JSON.stringify(argArray))}`
          : base,
        {
          method: isGet ? "GET" : "POST",
          headers: {
            "content-type": "application/json",
          },
          body: isGet ? null : JSON.stringify(argArray),
        }
      );
      if (target.isMakeRequest) return req;
      return fetch(req).then((res) => {
        if (res.status === 401) {
          // location.href = "/login";
        }
        if (
          res.headers.get("content-type")?.toLowerCase() === "application/json"
        ) {
          return res.json();
        }
        return res;
      });
    },
  }) as any;
};
type Promisify<T> = {
  [K in keyof T]: T[K] extends (...params: infer P) => infer R
  ? ((
    ...params: P
  ) => Promise<Awaited<R>>) & {
    makeRequest: (...params: P) => Promise<Request>;
  }
  : Promisify<T[K]>;
};

// const api = createHandler("http://localhost:3001/api") as Promisify<Api>;
