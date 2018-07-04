
import * as ApiMeta from "../../utils/ApiMeta";
import { ICachedPage, IPageConfig, IPageContent,IPageBuildContext } from "./PageTypes";


import EntityList from "./contents/EntityList";
import EntityNew from "./contents/EntityNew";
import EntityDetail from "./contents/EntityDetail";
import EntityEdit from "./contents/EntityEdit";
import EntityHelp from "./contents/EntityHelp";

const contentBuilders = {
    EntityList,
    EntityNew,
    EntityDetail,
    EntityEdit,
    EntityHelp
};

export async function build( cfg:IPageConfig,ctx:IPageBuildContext): Promise<ICachedPage>{
    var re = await contentBuilders[cfg.Content.Type](cfg.Content,ctx);
    return {
        path: cfg.Path,
        title: cfg.Title,
        //links: cfg.Links ? cfg.Links.map(l => ({ to: l.To, text: l.Text })) : [],
        head:re.head,
        component:re.component
    };
}
