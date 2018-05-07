
import * as ApiMeta from "../../utils/ApiMeta";
import { ICachedPage, IPageConfig, IPageContent } from "./PageTypes";


import EntityList from "./contents/EntityList";
import EntityNew from "./contents/EntityNew";
import EntityDetail from "./contents/EntityDetail";
import EntityEdit from "./contents/EntityEdit";

const contentBuilders = {
    EntityList,
    EntityNew,
    EntityDetail,
    EntityEdit
};

export async function build(lib: ApiMeta.Library, cfg:IPageConfig,permissions:{[index:string]:string}): Promise<ICachedPage>{
    var re = await contentBuilders[cfg.Content.Type](lib, cfg.Content,permissions);
    return {
        path: cfg.Path,
        title: cfg.Title,
        //links: cfg.Links ? cfg.Links.map(l => ({ to: l.To, text: l.Text })) : [],
        head:re.head,
        component:re.component
    };
}
