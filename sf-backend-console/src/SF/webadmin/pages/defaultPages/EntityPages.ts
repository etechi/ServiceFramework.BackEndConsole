import { IPageConfig } from "../PageTypes"
import * as ApiMeta from "../../../utils/ApiMeta";
import * as Meta from "../../../utils/Metadata";


const pages = {
    async list(lib: ApiMeta.Library,permission:string, entity: string, svc: string): Promise<IPageConfig> {
        const entityTitle = lib.getEntityTitle(entity) || entity;
        const controller = lib.getEntityController(entity);
        var attrValues = Meta.attrFirstValue(controller, Meta.EntityManagerAttribute);
        var mgr = controller.Methods.filter(a => a.Name == "Create" || a.Name == "Update").length > 0;

        var title = attrValues.Title || entityTitle + (mgr ? "管理" : "");
        return {
            Path:`/ap/entity/${entity}/`,
            Title: title,
            Content: {
                Path:'', 
                Config : JSON.stringify({
                    entity: entity,
                    service : svc
                }),
                Type : "EntityList"
            }
        }
    },
    async help(lib: ApiMeta.Library,permission:string, entity: string, svc: string): Promise<IPageConfig> {
        const entityTitle = lib.getEntityTitle(entity) || entity;
        const controller = lib.getEntityController(entity);
        var attrValues = Meta.attrFirstValue(controller, Meta.EntityManagerAttribute);
        var mgr = controller.Methods.filter(a => a.Name == "Create" || a.Name == "Update").length > 0;

        var title = (attrValues.Title || entityTitle + (mgr ? "管理" : ""))+"帮助";
        return {
            Path:`/ap/entity/${entity}/help`,
            Title: title,
            Content: {
                Path:'', 
                Config : JSON.stringify({
                    entity: entity,
                    service : svc
                }),
                Type : "EntityHelp"
            }
        }
    },
    async new(lib: ApiMeta.Library,permission:string, entity: string, svc: string): Promise<IPageConfig> {
        const entityTitle = lib.getEntityTitle(entity) || entity;
        return {
            Path: `/ap/entity/${entity}/new/${svc}`,
            Title: '新建' + entityTitle,
            Content: {
                Path: '',
                Config: JSON.stringify({
                    entity: entity,
                    service: svc
                }),
                Type: "EntityNew"
            }
        }
    },
    async edit(lib: ApiMeta.Library,permission:string, entity: string, svc: string):Promise< IPageConfig> {
        var ec=lib.getEntityController(entity);
        var isReadonly=permission=="ReadOnly";
        const entityTitle = lib.getEntityTitle(entity) || entity;
        return {
            Path: `/ap/entity/${entity}/edit/${svc}`,
            Title: entityTitle,
            Content: {
                Path: '',
                Config: JSON.stringify({
                    entity: entity,
                    service: svc,
                    readonly: isReadonly
                }),
                Type: "EntityEdit"
            }
        }
    },
    async detail(lib: ApiMeta.Library,permission:string, entity: string, svc: string):Promise< IPageConfig> {
        var ec=lib.getEntityController(entity);
        var isReadonly=permission=="ReadOnly";
        const entityTitle = lib.getEntityTitle(entity) || entity;
        return {
            Path: `/ap/entity/${entity}/detail/${svc}`,
            Title: entityTitle,
            Content: {
                Path: '',
                Config: JSON.stringify({
                    entity: entity,
                    service: svc,
                    readonly: isReadonly
                }),
                Type: "EntityDetail"
            }
        }
    }
}
function CommonActionPage(lib: ApiMeta.Library,permission:string, entity: string, svc: string, action:string): IPageConfig {
    const entityTitle = lib.getEntityTitle(entity) || entity;
    const controller = lib.getEntityController(entity);
    const act=lib.action(controller.Name,action);
    var entityAction=Meta.attrFirstValue(act,Meta.EntityActionAttribute);
    if(entityAction.Mode!="Query")
        return null;
    var title = act.Title;
    return {
        Path:`/ap/entity/${entity}/${action}`,
        Title: title,
        Content: {
            Path:'', 
            Config : JSON.stringify({
                entity: entity,
                service : svc,
                action: action
            }),
            Type : "EntityList"
        }
    }
}
export default async function resolve(lib: ApiMeta.Library, path: string,permissions:{[index:string]:string}): Promise<IPageConfig>{
    if (!path.startsWith("/ap/entity/"))
        return;
    var parts = path.split('/');// [0]/[1]ap/[2]entity/[3]${entity}/[4]detail/[5]${svc}
    var perm=permissions[parts[3]];
    if(!perm)return;
    var p = pages[parts[4] || "list"];
    if (!p) {
        const controller = lib.getEntityController(parts[3]);
        const action=lib.action(controller.Name,parts[4]);
        if(action)
            return CommonActionPage(lib,perm,parts[3],parts[5],parts[4]);
        return;
    }
    return await p(lib,perm, parts[3], parts[5]);
}