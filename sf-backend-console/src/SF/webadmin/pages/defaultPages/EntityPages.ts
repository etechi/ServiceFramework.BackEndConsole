import { IPageConfig } from "../PageTypes"
import * as ApiMeta from "../../../utils/ApiMeta";
import * as Meta from "../../../utils/Metadata";


const pages = {
    list(lib: ApiMeta.Library, entity: string, svc: string): IPageConfig {
        const entityTitle = lib.getEntityTitle(entity) || entity;
        const controller = lib.getEntityController(entity);
        var attrValues = Meta.attrFirstValue(controller, Meta.EntityManagerAttribute);
        var mgr = controller.Methods.filter(a => a.Name == "Create" || a.Name == "Update").length > 0;

        var title = attrValues.Title || entityTitle + (mgr ? "管理" : "");
        return {
            Path:`/ap/entity/list/${entity}/${svc}`,
            Title: title,
            Links:[],
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
    new(lib: ApiMeta.Library, entity: string, svc: string): IPageConfig {
        const entityTitle = lib.getEntityTitle(entity) || entity;
        return {
            Path: `/ap/entity/new/${entity}/${svc}`,
            Title: '新建' + entityTitle,
            Links: [],
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
    detail(lib: ApiMeta.Library, entity: string, svc: string): IPageConfig {
        const entityTitle = lib.getEntityTitle(entity) || entity;
        return {
            Path: `/ap/entity/detail/${entity}/${svc}`,
            Title: entityTitle,
            Links: [],
            Content: {
                Path: '',
                Config: JSON.stringify({
                    entity: entity,
                    service: svc
                }),
                Type: "EntityDetail"
            }
        }
    }
}

export default function resolve(lib: ApiMeta.Library, path: string): IPageConfig{
    if (!path.startsWith("/ap/entity/"))
        return;
    var parts = path.split('/');
    var p = pages[parts[3]];
    if (!p) return;
    return p(lib, parts[4], parts[5]);
}