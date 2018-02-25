
import * as ApiMeta from "../../utils/ApiMeta";
import { ICachedPage, IPageConfig, IPageContent } from "./PageTypes";


import EntityList from "./contents/EntityList";
import EntityNew from "./contents/EntityNew";
import EntityDetail from "./contents/EntityDetail";

const contentBuilders = {
    EntityList,
    EntityNew,
    EntityDetail
};

export function build(lib: ApiMeta.Library, cfg:IPageConfig): ICachedPage{
    var re = contentBuilders[cfg.Content.Type](lib, cfg.Content);
    return {
        path: cfg.Path,
        title: cfg.Title,
        links: cfg.Links ? cfg.Links.map(l => ({ to: l.To, text: l.Text })) : [],
        head:re.head,
        component:re.component
    };
}
