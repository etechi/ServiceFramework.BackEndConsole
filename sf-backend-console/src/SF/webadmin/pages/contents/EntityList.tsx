﻿import * as React from 'react'
import * as ReactRouter from 'react-router'
import { Link } from "react-router-dom";

import { EntityTable, IActionBuilder } from "../../../components/webapi/EntityTable";
import * as ApiMeta from "../../../utils/ApiMeta";
import * as Meta from "../../../utils/Metadata";
import { show as showModal } from "../../../components/utils/Modal";
import { IPageContent, IPageRender, IPageContentRefer } from "../PageTypes";
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
        throw `查询动作${act.Name}返回值类型${act.Type} 和实体${entity} 查询接口参数${query.Parameters[0].Title} 不同`;
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

function handleContextAction(
    lib: ApiMeta.Library,
    controller: string,
    action: ApiMeta.Method,
    id: any[],
    refresh: () => void)
{
    var mExecuting = showModal({
        closable: false,
        title: '正在执行',
        children: '正在执行' + action.Title + ',请稍后...'
    });
    lib.call(controller, action.Name, { [action.Parameters[0].Name]: id[0] }, null).then(re => {
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
export default function build(lib: ApiMeta.Library, ctn: IPageContent): IPageRender{
    var cfg = JSON.parse(ctn.Config);
    var readonly = cfg.ReadOnly;
    var entity = cfg.entity;
    const entityTitle = lib.getEntityTitle(entity) || entity;

    const controller = lib.getEntityController(cfg.entity);
    if (!controller)
        throw "找不到实体控制器：" + cfg.entity;

    var CreateAction = false,
        UpdateAction = false,
        LoadForEditAction = false,
        LoadAction = false,
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
    var entityActions = controller.Methods
        .map(a => ({
            action: a,
            attr: Meta.attrFirstValue(a, Meta.EntityActionAttribute)
        }))
        .filter(a => a.attr != null).map(a => ({
            action: a.action,
            attr: a.attr,
            type: detectActionType(lib, a.action,cfg.entity)
        }));


    var actionBuilders: IActionBuilder[] = null;
    var headActionBuilders: IActionBuilder[] = null;
    if (!ListAction && !QueryAction)
        return {
            component: () =><div>不支持列表</div>
        };

    var globalActions = entityActions.filter(a =>
        a.type == ActionType.GlobalForm || a.type == ActionType.GlobalView
    );
    if (globalActions.length > 0) {
        headActionBuilders = globalActions.map(a => {
            var cond = a.attr.ConditionExpression ? new Function('return ' + a.attr.ConditionExpression) : () => true;
            const linkBase = `/ap/entity/${a.action.Name}/${entity}/${cfg.service}`;
            return {
                build: (r: any, idx: any) => {
                    return cond.call(r) ?
                        <Link key={idx} className="btn btn-default btn-xs table-action" title={a.action.Description} to={linkBase} >{a.action.Title}</Link> :
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
        const listAction = lib.action(controller.Name, QueryAction ? 'Query' : 'List');
        const type = lib.detectListResultType(lib.type(listAction.Type));
        const ids = lib.getIdentPropNames(type);
        const getKey = (r: any) =>
            ids.map(id => r[id]);
        const getKeyStr = (r: any) =>
            getKey(r).join('/')
                
        actionBuilders = listItemActions.map(a => {
            var cond = a.attr.ConditionExpression ? new Function('return ' + a.attr.ConditionExpression) : () => true;
            if (a.type == ActionType.ContextForm || a.type == ActionType.ContextView) {
                const linkBase = `/ap/entity/${a.action.Name}/${cfg.entity}/${cfg.service}`;
                return {
                    build: (r: any, idx: any) => {
                        return cond.call(r) ?
                            <Link key={idx} className="btn btn-default btn-xs table-action" title={a.action.Description} to={linkBase + "?id="+getKeyStr(r)} >{a.action.Title}</Link> :
                            null;
                    },
                    textLength: a.action.Title.length
                }
            }
            else if (a.type == ActionType.ContextQuery) {
                const linkBase = `/ap/entity/list/${cfg.entity}/${cfg.service}`;
                var startQuery = (id: any) => {
                    lib.call(
                        controller.Name,
                        a.action.Name,
                        {
                            [a.action.Parameters[0].Name]: id
                        }, null).then(re => {
                            location.href = linkBase + '?filter=' + JSON.stringify(re);
                        });
                };
                return {
                    build: (r: any, idx: any) => {
                        return cond.call(r) ?
                            <button type="button" key={idx} className="btn btn-default btn-xs table-action" onClick={() => startQuery(getKeyStr(r))} > {a.action.Title}</button> :
                            null;
                    },
                    textLength: a.action.Title.length
                };

            }
            else
                return {
                    build: (r: any, idx: any, refresh: any) => {
                        return cond.call(r) ?
                            <button
                                key={idx}
                                className="btn btn-default btn-xs table-action"
                                title={a.action.Description}
                                onClick={() => handleContextAction(lib, controller.Name, a.action, getKey(r), refresh)} >{a.action.Title}</button> :
                            null;
                    },
                    textLength: a.action.Title.length
                }

        });
    } 
    var headerLinks = !readonly && CreateAction ? [{ to: `/ap/entity/new/${entity}/${cfg.service}`, text: '添加' + entityTitle }] : null;

    return {
        head: (ctn: IPageContentRefer) =>
            (headerLinks?headerLinks.map((l, i) =>
                <Link key={"l" + i} className="btn btn-primary" to={l.to} >{l.text}</Link>
             ):[])
            .concat(
                headActionBuilders ? headActionBuilders.map((a, i) =>
                    a.build(null, i, ()=>ctn().refresh())
                ) :[])
        ,
        component: class EntityList extends React.Component<{}>{
            constructor(props: any) {
                super(props);
                props.head(
                    (headerLinks ? headerLinks.map((l, i) =>
                        <Link key={"l" + i} className="btn btn-primary" to={l.to} >{l.text}</Link>
                    ) : [])
                        .concat(
                        headActionBuilders ? headActionBuilders.map((a, i) =>
                            a.build(null, i, () => this.refresh())
                        ) : [])
                );
            }
            refresh() {
                (this.refs["table"] as any).refresh();
            }
            render() {
                return <EntityTable
                    ref="table"
                    controller={controller.Name}
                    action={QueryAction ? "Query" : "List"}
                    serviceId={cfg.service}
                    className="full-page-list"
                    //titleLinkBuilder={args.titleLinkBuilder}
                    actions={actionBuilders}
                    readonly={readonly}
                //filterValue={filter}
                />
            }
        }
    }
}