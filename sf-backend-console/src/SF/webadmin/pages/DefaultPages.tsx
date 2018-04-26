import * as React from 'react'
import * as ApiMeta from "../../utils/ApiMeta";
import { IPageConfig, IPageContent } from "./PageTypes";

import EntityPages from "./defaultPages/EntityPages";
var resolvers = [EntityPages];

export async function resolve(lib: ApiMeta.Library, path: string,permissions:{[index:string]:string}): Promise<IPageConfig> {
    for (var i = 0; i < resolvers.length; i++) {
        var r = resolvers[i];
        var re = await r(lib, path,permissions);
        if (re) return re;
    }
    return null;
}