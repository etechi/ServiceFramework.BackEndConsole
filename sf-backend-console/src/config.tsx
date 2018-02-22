import * as  ManagerBuilder  from "SF/webadmin/ManagerBuilder"; 
import * as ApiMeta from "SF/utils/ApiMeta";


function itemNormalize(items: any[]): any[] {
    var re: any[] = [];
    var l2: any[] = [];
    items.forEach(i => {
        if (i.Children[0].Children && i.Children[0].Children.length)
            re.push(i);
        else
            l2.push(i);
    });
    re.unshift({Id: 0, ObjectState: "Enabled", Name: "", Title: "", Children: l2, Action: "None" } as any);
    return re;
}
function newItem(item: any): ManagerBuilder.IItemConfig {
    switch (item.Action) {
        case "Link":
            return {
                type: "open", title: item.Title || item.Name, source: item.ActionArgument
            };
        case "EntityManager":
            return {
                type: "entity", title: item.Title || item.Name, source: item.ActionArgument,
                service:(item as any).ServiceId
            };
        default:
            return null;
    }
}
function newModule(item: any): ManagerBuilder.IModuleConfig {
    var items = item.Children.map(c => newItem(c));
    return {
        title: item.Title || item.Name,
        items: items
    };
}
function newGroup(item: any): ManagerBuilder.IGroupConfig {
    var modules = item.Children.map(c => newModule(c));
    return {
        title: item.Title || item.Name,
        modules: modules
    }; 

}
export var ManagerBuildResult: ManagerBuilder.IManagerBuildResult = null;
export function build(
    lib: ApiMeta.Library,
    root:string,
    permissions: ManagerBuilder.IPermission[],
    items: any[],
    all?: boolean
) {
    var cfg:ManagerBuilder.IManagerConfig ={urlRoot:root,groups:[]};
    if (items && items.length) {
        items = itemNormalize(items);
        cfg.groups = items.map(i => newGroup(i));
    }
    var ManagerBuildResult = ManagerBuilder.buildManager(lib, cfg, permissions, all);
    return ManagerBuildResult;
}
