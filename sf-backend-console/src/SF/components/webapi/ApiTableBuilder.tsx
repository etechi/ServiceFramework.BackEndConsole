﻿import * as React from 'react'
import * as  apicall  from "../../utils/apicall";
import * as  ApiMeta  from "../../utils/ApiMeta";
import * as  Meta  from "../../utils/Metadata";
import  assign  from "../../utils/assign"; 
import * as TableColumn from "../tables/TableColumn";

export interface TableConfig {
    id: string;
    controller: string;
    hasParams: boolean; 
    action: ApiMeta.Method;
    columns: TableColumn.TableColumn[];
    keyColumns: TableColumn.TableColumn[];
    entity: string;
    entityReadonly: boolean;
    pagingSupported: boolean;
}

//function buildColumns(lib: ApiMeta.Library, controller: string, action: string, entityLinkBuilder?: (type: string, id: any) => string) {
//    var colType = lib.detectListResultType(lib.type(lib.action(controller, action).Type));
//    if (!colType)
//        throw "API返回类型不是数组或查询结果";
//    return TableColumn.buildTableColumns(lib, colType, entityLinkBuilder);
//}

export function build(lib: ApiMeta.Library, controller: string, action: string) {
    var act = lib.action(controller, action);

    //var cols = buildColumns(lib, controller, action, entityLinkBuilder);
    var retType = lib.type(lib.action(controller, action).Type);
    var colType = lib.detectListResultType(retType);
    if (!colType)
        throw "API返回类型不是数组或查询结果";

    var cols = TableColumn.buildTableColumns(lib, colType);

    var keyCols: TableColumn.TableColumn[] = cols.filter(c => Meta.attrExists(c.prop, Meta.KeyAttribute));
    if (keyCols.length == 0)
        throw `${controller}/${action}结果未定义主键`;

    var entity: string = null;
    var attrValues = Meta.attrFirstValue(colType, Meta.EntityObjectAttribute);
    if (attrValues)
        entity = attrValues.Entity;
        
    var entityReadonly = false;
    if (entity)
    {
        var mc = lib.getEntityController(entity);
        if (!mc) throw `${controller}/${action}找不到实体控制器:${entity}`; 
       entityReadonly = lib.action(mc.Name, "LoadForEdit") == null;
    }
    
    var tc: TableConfig ={
        id: controller + "/" + action,
        action: act,
        controller: controller,
        hasParams: act.Parameters && act.Parameters.length > 0 || false,
        entity: entity || null,
        entityReadonly: entityReadonly,
        keyColumns: keyCols,
        columns: cols,
        pagingSupported: !retType.IsArrayType
    };
    return tc;
}