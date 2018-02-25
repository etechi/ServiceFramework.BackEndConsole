import * as apicall from '../../utils/apicall';

import * as ApiMeta from "../../utils/ApiMeta";

import { resolve as defaultPageResolve } from "./DefaultPages";
import { build as buildPage } from "./PageBuilder";
import { ICachedPage } from "./PageTypes";

var pageCache: { [index: string]: ICachedPage } = {};

export function tryLoad(path: string): ICachedPage {
    return pageCache[path];
}
export function load(lib: ApiMeta.Library, path: string): PromiseLike<ICachedPage> {
    var p = pageCache[path];
    if (p) return Promise.resolve(p);
    return apicall.call("BackEndAdminConsole", "GetPage", { ConsoleIdent: "default", PagePath: path }).then((re: any) => {
        if (!re)
            re = defaultPageResolve(lib, path);
        if (!re)
            return null;
        return pageCache[path] = buildPage(lib, re);
    });
}
        