
export interface IPageContentRefer {
    (): any;
}
export interface IPageRender {
    head?(ctn: IPageContentRefer): any;
    component: any;
}
export interface ICachedPage{
    title:string,
    path: string,
    head(ctx: IPageContentRefer): any;
    links: { to?: string, text: string }[];
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
    Links: { To?: string, Text: string }[];
    Content: IPageContent
}
