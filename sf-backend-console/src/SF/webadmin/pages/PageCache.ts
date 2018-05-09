import * as apicall from '../../utils/apicall';


import { resolve as defaultPageResolve } from "./DefaultPages";
import { build as buildPage } from "./PageBuilder";
import { ICachedPage } from "./PageTypes";
import * as ApiMeta from "../../utils/ApiMeta";

export class PageCache
{
    pages: { [index: string]: ICachedPage } = {};
    permissions:{[index:string]:string};
    consoleId:number;
    constructor(consoleId:number,permissions:{[index:string]:string}){
        this.consoleId=consoleId;
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
        return this.pages[path] = await buildPage(re,{consoleId:this.consoleId,lib,path,permissions:this.permissions});
    }
}
        