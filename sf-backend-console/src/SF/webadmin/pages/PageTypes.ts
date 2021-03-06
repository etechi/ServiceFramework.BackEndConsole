﻿import * as ApiMeta from "../../utils/ApiMeta";

export interface IPageContentRefer {
    (): any;
}
export interface IPageRender {
    head?(ctn: IPageContentRefer): {actions?:React.ReactNode,nav?:React.ReactNode};
    component: any;
}
export interface ICachedPage{
    title:string, 
    path: string,
    head(ctx: IPageContentRefer): any;
    //links: { to?: string, text: string }[];
    component: any,
}

export interface IPageContent {
    Path: string;
    Type: string;
    Config: string;
    Children?: IPageContent[]
}
export interface IPageConfig {
    Path: string;
    Title: string;
    Content: IPageContent
}
export interface IPageBuildContext{
    consoleId:number;
    lib: ApiMeta.Library;
    path:string;
    permissions:{[index:string]:string}
}