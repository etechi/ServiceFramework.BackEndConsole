import * as React from 'react'
import * as ApiMeta from "../../utils/ApiMeta";
import { IPageConfig, IPageContent } from "./PageTypes";

import EntityPages from "./defaultPages/EntityPages";
var resolvers = [EntityPages];

export function resolve(lib: ApiMeta.Library, path: string): IPageConfig {
    for (var i = 0; i < resolvers.length; i++) {
        var r = resolvers[i];
        var re = r(lib, path);
        if (re) return re;
    }
    return null;
}