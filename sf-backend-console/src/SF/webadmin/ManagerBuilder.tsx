﻿import * as React from 'react';
import {Route} from 'react-router';
import {Link} from 'react-router-dom';

import * as menu from './menu-types';
import * as EntityLinkBuilder from '../utils/EntityLinkBuilder';
import * as Meta from "../utils/Metadata";
import * as ApiMeta from "../utils/ApiMeta";
import * as Views from './components/Views';
import {IActionBuilder} from "../components/webapi/EntityTable";
import {show as showModal} from "../components/utils/Modal";
import {createBrowserHistory} from "history"
var browserHistory=createBrowserHistory();

export enum EntityItemMode {
    Normal,
    ReadOnly,
    NoCreate
}
export interface IItemConfig {
    type: "entity" | "form" | "list" |"setting" | "help" |"iframe" | "open",
    source: string;
    icon?: string; 
    title?: string;
    entityMode?: EntityItemMode;
    hidden?: boolean;
    service?: number;
}

export interface IModuleConfig {
    icon?: string;
    title: string;
    items: IItemConfig[]
}
export interface IGroupConfig {
    title: string;
    modules: IModuleConfig[]
}
export interface IManagerConfig {
    urlRoot: string;
    groups: IGroupConfig[];
}
export interface IManagerBuildResult {
    menus: menu.IMenuCategory[];
    routes: JSX.Element[];
    entityLinkBuilders: { [index: string]: EntityLinkBuilder.IEntityLinkBuilder }
}
export interface IPermission {
    ResourceId: string;
    OperationId: string;
}

interface IBuildContext {
    lib: ApiMeta.Library;
    cfg: IManagerConfig;
    permissions: { [index: string]: string[] }
    group?: IGroupConfig;
    module?: IModuleConfig;
    item?: IItemConfig;
    entityLinkBuilders: { [index: string]: EntityLinkBuilder.IEntityLinkBuilder };
    menus: menu.IMenuCategory[];
    menuItems: menu.IMenuItem[];
    routes: JSX.Element[];
    linkBase: string;
    all?: boolean;
}

function isDenied(os: string[]) {
    return os != null && os.indexOf("查看") == -1 && os.indexOf("管理") == -1;
}
function isReadonly(os: string[]) {
    return os != null && os.indexOf('查看') != -1 && os.indexOf("管理") == -1;
}

/*
形式有参数决定：
    有当前实体ID参数：
        没有其他参数：快速上下文命令，显示在列表项命令区，按钮
        有其他参数：有UI的上下文命令，显示在列表项命令区，链接
    没有当前实体ID参数：显示在列表页面头部
        没有参数：快速全局命令，如清除缓存
        有其他参数：有UI的全局命令，如新建
*/


enum ActionType {
    ContextDirectly,
    ContextForm,
    ContextView,
    ContextQuery,
    GlobalDirectly,
    GlobalForm,
    GlobalView
}
function EnsureQueryArgumentType(lib: ApiMeta.Library, act: ApiMeta.Method, entity: string) {
    var ctl = lib.getEntityController(entity);
    if (!ctl)
        throw `找不到查询动作${act.Name}的实体类型${entity}`;
    var query = lib.action(ctl.Name, "Query");
    if (!query || !query.Parameters)
        throw `实体${entity}的查询接口没有参数`;

    
    if (query.Parameters[0].Type != act.Type)
        throw `查询动作${act.Name}返回值类型${act.Type } 和实体${entity } 查询接口参数${query.Parameters[0].Title } 不同`;
}
function detectActionType(lib: ApiMeta.Library, a: ApiMeta.Method, entity: string) {
    var ps = a.Parameters || [];

    if (!ps.length) return ActionType.GlobalDirectly;
    if (ps.length == 1 && a.HeavyParameter) {
        var type = lib.type(ps[0].Type);
        var props = lib.allTypeProperties(type);
        if (props.some(p => (Meta.attrFirstValue(p, Meta.EntityIdentAttribute) || {}).Entity == entity)) {
            if (props.length > 1)
                return ActionType.ContextForm;

            return lib.allTypeProperties(lib.type(a.Type)).length > 0 ? ActionType.ContextView : ActionType.ContextDirectly;
        }
    }
    else if (ps.some(p => (Meta.attrFirstValue(p, Meta.EntityIdentAttribute) || {}).Entity == entity)) {

        if (ps.length > 1)
            return ActionType.ContextForm;

        if (lib.attrValue(a, Meta.EntityActionAttribute).Mode == "Query") {
            EnsureQueryArgumentType(lib, a, entity);
            return ActionType.ContextQuery;
        }
        return lib.allTypeProperties(lib.type(a.Type)).length > 0 ? ActionType.ContextView : ActionType.ContextDirectly;
    }
    return ActionType.GlobalForm;
}
function buildEntityItem(ctx: IBuildContext) :void{
    const entity = ctx.item.source;
    const controller = ctx.lib.getEntityController(entity);
    if (!controller)
        throw "找不到实体控制器：" + entity;
    const entityTitle=ctx.lib.getEntityTitle(entity) || entity;

    var os = !ctx.permissions ? null : (ctx.permissions[entity] || []);
    if (isDenied(os))
        return null;
    var readonly = isReadonly(os) || ctx.item.entityMode == EntityItemMode.ReadOnly;

    var CreateAction = false,
        UpdateAction = false,
        LoadForEditAction = false,
        LoadAction=false,
        GetAction = false,
        ListAction = false,
        QueryAction = false;
    controller.Methods.forEach(a => {
        switch (a.Name) {
            case "Create": CreateAction = true; break;
            case "Update": UpdateAction = true; break;
            case "LoadForEdit": LoadForEditAction = true; break;
            case "Load": LoadAction = true; break;
            case "Get": GetAction = true; break;
            case "List": ListAction = true; break;
            case "Query": QueryAction = true; break;
        }
    });

    var attrValues = Meta.attrFirstValue(controller, Meta.EntityManagerAttribute);
    var title = ctx.item.title || attrValues.Title || entityTitle + (CreateAction || UpdateAction ? "管理" : "");
    var icon = ctx.item.icon || attrValues.IconClass || "fa fa-wrench";
    const entityEncoded = encodeURIComponent(entity);
    var routeBeginIndex=ctx.routes.length;
    if (LoadForEditAction || GetAction || LoadAction)
    {
        var view=Views.EditView({
            links: [{ text: ctx.module.title }, { text: title }, { text: '查看' + entityTitle }],
            controller: controller.Name,
            serviceId: ctx.item.service,
            readonly: true,
            loadAction: LoadForEditAction && !readonly ? "LoadForEdit" : LoadAction ? "Load" : "Get"
        });
        ctx.routes.push(
            <Route key={"i"+ctx.routes.length} path={ctx.linkBase+entity+"/detail/*"} component={view}/>
        );
    }
    if (!readonly) {
        if (CreateAction && (ctx.item.entityMode != EntityItemMode.NoCreate))
            ctx.routes.push(<Route key={"i"+ctx.routes.length} path={ctx.linkBase+entity+"/new"} component={Views.EditView({
                    links: [{ text: ctx.module.title }, { text: title }, { text: '添加' +entityTitle }],
                    controller: controller.Name,
                    serviceId: ctx.item.service,
                })}/>);
        if (UpdateAction)
            ctx.routes.push(<Route key={"i"+ctx.routes.length} path={ctx.linkBase+entity+"/edit/*"} component={Views.EditView({
                    links: [{ text: ctx.module.title }, { text: title }, { text: '编辑' + entityTitle }],
                    controller: controller.Name,
                    serviceId: ctx.item.service,
                })}/>);
    }
    if (!readonly && UpdateAction) {
        const linkBase = ctx.linkBase + entity + "/edit/";
        ctx.entityLinkBuilders[entity] = (ids: any[]) =>
            linkBase + ids.join("/");
    }
    else if (LoadForEditAction || GetAction || LoadAction) {
        const linkBase = ctx.linkBase + entity + "/detail/";
        ctx.entityLinkBuilders[entity] = (ids: any[]) =>
            linkBase + ids.join("/");
    }

   

    var entityActions = controller.Methods
        .map(a => ({
            action: a,
            attr: Meta.attrFirstValue(a, Meta.EntityActionAttribute)
        }))
        .filter(a => a.attr != null).map(a => ({
            action: a.action,
            attr: a.attr,
            type: detectActionType(ctx.lib,a.action, entity)
        }));


    var actionBuilders: IActionBuilder[] = null;
    var headActionBuilders: IActionBuilder[] = null;
    if (ListAction || QueryAction) {
        if (!ctx.item.hidden || ctx.all)
            ctx.menuItems.push(
                {
                    name: title,
                    icon: icon,
                    path: entityEncoded
                });

        //初始化上下文表单命令页面
        entityActions.filter(a => a.type == ActionType.ContextForm || a.type == ActionType.GlobalForm).forEach(action => {
            var initAction = ctx.lib.action(controller.Name, action.action.Name + "Init")
            var jumpback = !(action.action.Parameters && action.action.Parameters.length == 1 && action.action.Parameters[0].Type == action.action.Type);
            ctx.routes.push(<Route key={"i"+ctx.routes.length} path={ctx.linkBase+entity+"/"+ action.action.Name + "/*"} component={Views.EditView({
                    links: [{ text: ctx.module.title }, { text: title }, { text: action.action.Title }],
                    controller: controller.Name,
                    serviceId: ctx.item.service,
                    loadAction: initAction ? initAction.Name : null,
                    createAction: initAction ? null : action.action.Name,
                    updateAction: initAction ? action.action.Name : null,
                    jumpback: jumpback
                })}/>
            );
        });
        entityActions.filter(a => a.type == ActionType.ContextView || a.type== ActionType.GlobalView).forEach(action => {
            ctx.routes.push(<Route key={"i"+ctx.routes.length} path={ctx.linkBase+entity+"/"+ action.action.Name + "/*"} component={Views.EditView({
                    links: [{ text: ctx.module.title }, { text: title }, { text: action.action.Title }],
                    controller: controller.Name,
                    serviceId: ctx.item.service,
                    loadAction: action.action.Name,
                    readonly:true
                })}/>
            );
        });

        var globalActions = entityActions.filter(a =>
            a.type == ActionType.GlobalForm || a.type == ActionType.GlobalView
        );
        if (globalActions.length > 0) {
            headActionBuilders = globalActions.map(a => {
                var cond = a.attr.ConditionExpression ? new Function('return ' + a.attr.ConditionExpression) : () => true;
                const linkBase = ctx.cfg.urlRoot + ctx.linkBase + entityEncoded + '/' + a.action.Name + '/';
                return {
                    build: (r:any, idx:any) => {
                        return cond.call(r) ?
                            <Link key={idx} className="btn btn-default btn-xs table-action" title={a.action.Description} to={linkBase  } >{a.action.Title}</Link> :
                            null;
                    },
                    textLength: a.action.Title.length
                }
            });
        }

        var listItemActions = entityActions.filter(a =>
            a.type == ActionType.ContextView ||
            a.type == ActionType.ContextDirectly ||
            a.type == ActionType.ContextForm ||
            a.type == ActionType.ContextQuery
            );
        if (listItemActions.length > 0) {
            const listAction = ctx.lib.action(controller.Name, QueryAction ? 'Query' : 'List');
            const type = ctx.lib.detectListResultType(ctx.lib.type(listAction.Type));
            const ids = ctx.lib.getIdentPropNames(type);
            const getKey = (r: any) =>
                ids.map(id => r[id]);
            const getKeyStr = (r: any) =>
                getKey(r).join('/')
            const handleContextAction = (action: ApiMeta.Method, id: any[], refresh: () => void) => {
                var mExecuting = showModal({
                    closable:false,
                    title: '正在执行',
                    children: '正在执行' + action.Title+',请稍后...'
                });
                ctx.lib.call(controller.Name, action.Name, { [action.Parameters[0].Name]: id[0] }, null).then(re => {
                    refresh();
                    mExecuting.resolve();
                }, e => {
                    mExecuting.resolve();
                    showModal({
                        title: '执行错误',
                        children: <div>
                            <h5>正在执行<b>{action.Title}</b>时发生错误：</h5>
                            <div>{e._error}</div>
                        </div>
                    });
                });
            };
            actionBuilders = listItemActions.map(a => {
                var cond = a.attr.ConditionExpression ? new Function('return ' + a.attr.ConditionExpression) : () => true;
                if (a.type == ActionType.ContextForm || a.type == ActionType.ContextView) {
                    const linkBase = ctx.cfg.urlRoot + ctx.linkBase + entityEncoded + '/' + a.action.Name + '/';
                    return {
                        build: (r:any, idx:any) => {
                            return cond.call(r) ?
                                <Link key={idx} className="btn btn-default btn-xs table-action" title={a.action.Description} to={linkBase + getKeyStr(r) } >{a.action.Title}</Link> :
                                null;
                        },
                        textLength: a.action.Title.length
                    }
                }
                else if (a.type == ActionType.ContextQuery) {
                    const linkBase = ctx.cfg.urlRoot + ctx.linkBase + entityEncoded
                    var lib = ctx.lib;
                    var startQuery = (id:any) => {
                        lib.call(
                            controller.Name,
                            a.action.Name,
                            {
                                [a.action.Parameters[0].Name]: id
                            }, null).then(re => {
                                browserHistory.push({ pathname: linkBase+'?filter='+JSON.stringify(re)});
                            });
                    };
                    return {
                        build: (r:any, idx:any) => {
                            return cond.call(r) ?
                                <button type="button" key={idx} className="btn btn-default btn-xs table-action" onClick={() => startQuery(getKeyStr(r)) } > { a.action.Title }</button> :
                                null;
                        },
                        textLength: a.action.Title.length
                    };

                }
                else
                    return {
                        build: (r:any, idx:any, refresh:any) => {
                            return cond.call(r) ?
                                <button key={idx} className="btn btn-default btn-xs table-action" title={a.action.Description} onClick={() => handleContextAction(a.action, getKey(r), refresh) } >{ a.action.Title }</button> :
                                null;
                        },
                        textLength: a.action.Title.length
                    }

            });
        }
    }
    ctx.routes.splice(routeBeginIndex,0,
        <Route key={'i'+ctx.routes.length} path={ctx.linkBase+entity} component={ListAction || QueryAction ? Views.ListView({
            links: [{ text: ctx.module.title }, { text: title }],
            controller: controller.Name,
            serviceId: ctx.item.service,
            action: QueryAction ? 'Query' : 'List',
            headerLinks: !readonly && CreateAction && (ctx.item.entityMode != EntityItemMode.NoCreate) ? [{ to: ctx.cfg.urlRoot + ctx.linkBase + entityEncoded + '/new', text: '添加' + entityTitle }] : null,
            headerActionBuilders: headActionBuilders,
            actionBuilders: actionBuilders,
            readonly: readonly
        }) : null} />
    );
}
function getRelatedEntity(action: ApiMeta.Method, controller: ApiMeta.Service) {
    var attrValues = Meta.attrFirstValue(action, Meta.EntityRelatedAttribute);
    if (attrValues && attrValues.Entity)
        return attrValues.Entity;

    attrValues = Meta.attrFirstValue(controller, Meta.EntityManagerAttribute);
    if (attrValues && attrValues.Entity)
        return attrValues.Entity;

    attrValues = Meta.attrFirstValue(controller, Meta.EntityRelatedAttribute);
    return attrValues && attrValues.Entity || null;
}
function buildFormItem(ctx: IBuildContext):void {
    var i = ctx.item.source.indexOf('/');
    if (i == -1)
        throw '表单源格式错误：' + ctx.item.source;

    const controllerName = ctx.item.source.substring(0, i);
    const actionName = ctx.item.source.substr(i + 1);
    const controller = ctx.lib.controller(controllerName);
    if (!controller)
        throw '找不到表单控制器：' + ctx.item.source;

    var loadAction = ctx.lib.action(controllerName, 'Load' + actionName);
    var saveAction = ctx.lib.action(controllerName, 'Save' + actionName) || ctx.lib.action(controllerName, actionName);
    if (!saveAction)
        throw '找不到表单动作:' + ctx.item.source;


    var entity = getRelatedEntity(saveAction, controller);

    var os = !ctx.permissions || !entity ? null : (ctx.permissions[entity] || []);
    if (isDenied(os))
        return null;
    var readonly = isReadonly(os);

    var title = ctx.item.title || saveAction.Title || actionName;
    var icon = ctx.item.icon || 'fa fa-wrench';

    ctx.routes.push(<Route key={'i'+ctx.routes.length} path={ctx.linkBase+actionName} component={Views.EditView({
            id:1,
            links: [{ text: ctx.module.title }, { text: title }],
            controller: controller.Name,
            serviceId: ctx.item.service,
            loadAction: loadAction ? loadAction.Name : null,
            createAction: loadAction ? null : saveAction.Name,
            updateAction: saveAction && saveAction.Name || null,
            readonly: readonly
        })}/>);
    if (!ctx.item.hidden || ctx.all)
        ctx.menuItems.push(
            {
                name: title,
                icon: icon,
                path: actionName
            });

}
function buildListItem(ctx: IBuildContext):void {
    var i = ctx.item.source.indexOf('/');
    if (i == -1)
        throw '表单源格式错误：' + ctx.item.source;

    const controllerName = ctx.item.source.substring(0, i);
    const actionName = ctx.item.source.substr(i + 1);
    const controller = ctx.lib.controller(controllerName);
    if (!controller)
        throw '找不到表单控制器：' + ctx.item.source;

    var listAction = ctx.lib.action(controllerName, 'Query' + actionName) || ctx.lib.action(controllerName, 'List' + actionName);
    if (!listAction)
        throw '找不到列表动作:' + ctx.item.source;

    var loadAction = ctx.lib.action(controllerName, 'Load' + actionName) || ctx.lib.action(controllerName, 'Get' + actionName);
    var saveAction = ctx.lib.action(controllerName, 'Save' + actionName);
    var createAction = ctx.lib.action(controllerName, 'Create' + actionName) || ctx.lib.action(controllerName, 'New' + actionName);

    var entity = getRelatedEntity(listAction, controller);

    var os = !ctx.permissions || !entity ? null : (ctx.permissions[entity] || []);
    if (isDenied(os))
        return null;
    var readonly = isReadonly(os);

    var objTitle = ctx.item.title || listAction.Title || actionName;
    var listTitle = objTitle;
    if (saveAction)
        listTitle += '管理';
    else
        listTitle += '列表';

    var icon = ctx.item.icon || 'fa fa-wrench';
    const actionNameEncoded = encodeURI(actionName);

    if (loadAction)
        ctx.routes.push(<Route key={'i'+ctx.routes.length} path= {ctx.linkBase+actionName+'/detail/*'} component={Views.EditView({
                links: [{ text: ctx.module.title }, { text: listTitle }, { text: '查看' + objTitle }],
                controller: controller.Name,
                serviceId: ctx.item.service,
                readonly: true,
                loadAction: loadAction.Name
            })}/>
        );

    if (!readonly) {
        if (createAction)
        ctx.routes.push(<Route key={'i'+ctx.routes.length} path={ctx.linkBase+actionName+'/new'} component={Views.EditView({
                    links: [{ text: ctx.module.title }, { text: listTitle }, { text: '添加' + objTitle }],
                    controller: controller.Name,
                    serviceId: ctx.item.service,
                    createAction: createAction.Name,
                    updateAction: saveAction && saveAction.Name
                })}/>);
        if (saveAction)
        ctx.routes.push(<Route key={'i'+ctx.routes.length} path={ctx.linkBase+actionName+'/edit/*'} component={Views.EditView({
                    links: [{ text: ctx.module.title }, { text: listTitle }, { text: '编辑' + objTitle }],
                    controller: controller.Name,
                    serviceId: ctx.item.service,
                    loadAction: loadAction.Name,
                    updateAction: saveAction.Name
                })}/>);
    }

    const linkBase = ctx.cfg.urlRoot + ctx.linkBase + actionNameEncoded + '/' + (!readonly && saveAction ? 'edit' : 'detail') + '/';
    ctx.routes.push(<Route key={'i'+ctx.routes.length} path={ctx.linkBase+actionName} component={Views.ListView({
            links: [{ text: ctx.module.title }, { text: listTitle }],
            controller: controller.Name,
            serviceId: ctx.item.service,
            action: listAction.Name,
            titleLinkBuilder: (ids) => linkBase + ids.join('/'),
            headerLinks: !readonly && createAction ? [{ to: ctx.cfg.urlRoot + ctx.linkBase + actionNameEncoded + '/new', text: '添加' + objTitle }] : null
        })}/>);

    ctx.menuItems.push(
        {
            name: objTitle,
            icon: icon,
            path: actionName
        });

}


function buildHelpItem(ctx: IBuildContext) {
    if (!ctx.menuItems.length)
        return;
    ctx.menuItems.push({
        name: '帮助',
        icon: 'fa fa-question',
        path: 'help',
    });
    ctx.routes.push(<Route key={ 'i'+ctx.routes.length} path={ctx.linkBase+'help'} component={Views.HelpView({
            links: [{ text: ctx.module.title }, { text: '帮助' }],
            help: ctx.item.source
        })}/>);
}

function buildIFrameItem(ctx: IBuildContext) {
    ctx.menuItems.push({
        name: ctx.item.title,
        icon: ctx.item.icon,
        path: encodeURI(ctx.item.title),
    });
    ctx.routes.push(<Route key={ 'i'+ctx.routes.length}  path={ctx.linkBase+encodeURI(ctx.item.title)} component={Views.IFrameView({
            links: [{ text: ctx.module.title }, { text: ctx.item.title }],
            src: ctx.item.source
        })}/>);
}
function buildOpenItem(ctx: IBuildContext) {
    ctx.menuItems.push({
        name: ctx.item.title,
        icon: ctx.item.icon,
        path: ctx.item.source,
    });
}
function buildItem(ctx: IBuildContext) {
    switch (ctx.item.type) {
        case 'entity':
            buildEntityItem(ctx);
            break;
        case 'form':
            buildFormItem(ctx);
            break;
        case 'list':
            buildListItem(ctx);
            break;
        case 'help':
            buildHelpItem(ctx);
            break;
        case 'iframe':
            buildIFrameItem(ctx);
            break;
        case 'open':
            buildOpenItem(ctx);
            break;
    }
}

function buildModule(ctx: IBuildContext) {

    ctx.menuItems = [];
    const moduleEncoded = encodeURI(ctx.module.title);
    ctx.linkBase = '/'+ctx.module.title + '/';
    //var routes = ctx.routes;
    //ctx.routes = [];
    ctx.module.items.forEach(item => {
        ctx.item = item;
        buildItem(ctx);
    });
    //if (ctx.routes.length > 0)
     //   routes.push.apply(routes,ctx.routes);
    //ctx.routes = routes;
    if (ctx.menuItems.length > 0)
        ctx.menus.push({
            group: ctx.group.title || '',
            name: ctx.module.title,
            icon: ctx.module.icon || 'fa fa-wrench',
            items: ctx.menuItems,
            path: moduleEncoded
        });
}
function buildGroup(ctx: IBuildContext) {
    ctx.group.modules.forEach(m => {
        ctx.module = m;
        buildModule(ctx); 
    });
}
export function buildManager(
    lib: ApiMeta.Library,
    cfg: IManagerConfig,
    permissions: IPermission[],
    all?: boolean
): IManagerBuildResult {
    var pms: { [index: string]: string[] } = {};
    if (permissions)
        permissions.forEach(p => {
            var pm = pms[p.ResourceId];
            if (pm) pm.push(p.OperationId);
            else pms[p.ResourceId] = [p.OperationId];
        });
    else
        pms = null;

    var ctx: IBuildContext = {
        permissions: pms,
        cfg: cfg,
        lib: lib,
        entityLinkBuilders: {},
        menus: [],
        routes: [],
        menuItems: null,
        linkBase: '',
        all: all,

    };
    cfg.groups.forEach(g => {
        ctx.group = g;
        buildGroup(ctx);
    });
    return {
        entityLinkBuilders: ctx.entityLinkBuilders,
        menus: ctx.menus,
        routes: ctx.routes
    };
}