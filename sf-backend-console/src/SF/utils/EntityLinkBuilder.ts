﻿export interface IEntityLinkBuilder {
    (ids: any[],svc?:any): string
}

var entityMap: {
    [index: string]: IEntityLinkBuilder
} = {};
var rootUrl="";
export function setup(arg: { [index:string]: IEntityLinkBuilder }[],newRootUrl:string) {
    entityMap = arg
        .filter(es => !!es)
        .reduce((map, es) => {
            Object.keys(es).forEach(k => map[k] = es[k]);
            return map;
        }, {});
    rootUrl=newRootUrl;
}

export function buildEntityLink(type: string, ids: any[],svc:any) {
    if (!ids || ids.length == 0 || ids.length == 1 && !ids[0])
        return null;
    var builder = entityMap[type];
    if (!builder) return null;
    if (!svc) svc = 0;
    return rootUrl + builder(ids,svc);
}
