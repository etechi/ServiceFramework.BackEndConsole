﻿import { IPageConfig } from "../PageTypes"
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
            Path:`/ap/entity/${entity}/list/${svc}`,
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
            Path: `/ap/entity/${entity}/new/${svc}`,
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
            Path: `/ap/entity/${entity}/detail/${svc}`,
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
    var parts = path.split('/');// [0]/[1]ap/[2]entity/[3]${entity}/[4]detail/[5]${svc}
    var p = pages[parts[4]];
    if (!p) return;
    return p(lib, parts[3], parts[5]);
}