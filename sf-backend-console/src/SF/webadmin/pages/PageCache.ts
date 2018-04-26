import * as apicall from '../../utils/apicall';

import * as ApiMeta from "../../utils/ApiMeta";

import { resolve as defaultPageResolve } from "./DefaultPages";
import { build as buildPage } from "./PageBuilder";
import { ICachedPage } from "./PageTypes";

export class PageCache
{
    pages: { [index: string]: ICachedPage } = {};
    permissions:{[index:string]:string};
    constructor(permissions:{[index:string]:string}){
        this.permissions=permissions;
    }
    tryLoad(path: string): ICachedPage {
        return this.pages[path];
    }
    async load(lib: ApiMeta.Library, path: string): Promise<ICachedPage> {
        var p = this.pages[path];
        if (p) return p;
        var re=<any>await apicall.call("BackEndAdminConsole", "GetPage", { ConsoleIdent: "default", PagePath: path });
        if (!re)
        re = await defaultPageResolve(lib, path,this.permissions);
        if (!re)
            return null;
        return this.pages[path] = await buildPage(lib, re,this.permissions);
    }
}
        