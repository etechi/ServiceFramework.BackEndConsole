import * as React from 'react'
import * as ReactRouter from 'react-router'
import { Link } from "react-router-dom";

import { EntityTable, IActionBuilder } from "../../../components/webapi/EntityTable";
import * as ApiMeta from "../../../utils/ApiMeta";
import * as Meta from "../../../utils/Metadata";
import { show as showModal } from "../../../components/utils/Modal";
import {IPageContent, IPageRender, IPageContentRefer,IPageBuildContext } from "../PageTypes";
import * as apicall from '../../../utils/apicall';
import * as uri from '../../../utils/uri';
import * as lodash from 'lodash';


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
    var args={};
    if(action.HeavyParameter)
    {
        if(action.Parameters.length==1) 
            args[lib.type(action.Parameters[0].Type).Properties[0].Name]=id[0]
        else
            args[action.HeavyParameter]={
                [lib.type(action.Parameters.filter(p=>p.Name==action.HeavyParameter)[0].Type).Properties[0].Name]:id[0]
            };
    }
    else
        args[action.Parameters[0].Name]=id[0];
    lib.call(controller, action.Name, args, null).then(re => {
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
export default async function build(ctn: IPageContent,ctx:IPageBuildContext): Promise<IPageRender>{
    var {lib, permissions}=ctx;
    var cfg = JSON.parse(ctn.Config);
    var readonly = cfg.ReadOnly;
    var entity = cfg.entity;
    const entityTitle = lib.getEntityTitle(entity) || entity;

    var perm=permissions[entity];
    if(!perm)
        throw "无权访问实体数据：" + cfg.entity;
    if(!readonly && perm=="ReadOnly")
        readonly=true;


    const controller = lib.getEntityController(cfg.entity);
    if (!controller)
        throw "找不到实体控制器：" + cfg.entity;
    
    const action=cfg.action;
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

    const listAction = lib.action(controller.Name,action || (QueryAction ? 'Query' : 'List'));
    const type = lib.detectListResultType(lib.type(listAction.Type));
    const ids = lib.getIdentPropNames(type);
    const getKey = (r: any) =>
        ids.map(id => r[id]);
    const getKeyStr = (r: any) =>
        getKey(r).join('/')

            

    var actionBuilders: IActionBuilder[] = null;
    var headActionBuilders: IActionBuilder[] = null;
    if(!action)
    {
      

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
                const linkBase = `/ap/entity/${entity}/${a.action.Name}`;
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
                    
            actionBuilders = listItemActions.map(a => {
                var cond = a.attr.ConditionExpression ? new Function('return ' + a.attr.ConditionExpression) : () => true;
                if (a.type == ActionType.ContextForm || a.type == ActionType.ContextView) {
                    const linkBase = `/ap/entity/${cfg.entity}/${a.action.Name}`;
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
                    const linkBase = `/ap/entity/${cfg.entity}/`;
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
    }
    var headerLinks = !readonly && CreateAction ? [{ to: `/ap/entity/${entity}/new/${cfg.service || 0}`, text: '添加' + entityTitle }] : null;
    
    //查找关联查询 
    lib.getEntities()
    .map(e=>{var c=lib.getEntityController(e);return {e:e,c:c,m:c.Methods.filter(m=>m.Name=="Query")[0]};})
    .filter(c=>c.m)
    .forEach(c=>{
        if(!ctx.permissions[c.e])
            return;
        var at=lib.type(c.m.Parameters[0].Type);
       lib.allTypeProperties(at).filter(p=>lib.attrValue(p,Meta.EntityIdentAttribute).Entity==entity).forEach(p=>
            {

                if(!actionBuilders)actionBuilders=[];
                const linkBase = `/ap/entity/${c.e}/`;
                const title=lib.getEntityTitle(c.e) || c.e;
                //%7B%22pgO%22%3A0%2C%22pgIPP%22%3A20%2C%22pgT%22%3A0%2C%22args%22%3A%7B%22PatientId%22%3A18401%7D%7D
                //{"pgO":0,"pgIPP":20,"pgT":0,"args":{"PatientId":18401}}
                actionBuilders.push({
                    build: (r: any, idx: any) => {
                        var id=getKeyStr(r);
                        var val=p.Name=="Id"?{Id:{Id:id}}:{[p.Name]:id};
                        var q=encodeURIComponent(JSON.stringify({args:val}));
                        return <Link key={idx} className="btn btn-xs table-action" title={title} to={linkBase + "?q="+q} >{title}</Link>;
                    },
                    textLength:title.length
                });
            });
    });

    var consoleId=ctx.consoleId;
    var settingPath= `entity/${entity}/list/${action || 'query'}` ;
    async function loadQueries()
    {
        var re=await apicall.call<any>("BackEndConsoleUISetting", "List", { ConsoleId: consoleId, Path:settingPath});
        
        //查找存储查询
        var queries=re.map(s=>({Name:s.Name,Query:s.Value}));
        if(queries.length)
            queries.unshift({Name:"所有",Query:null});
        return queries;
    }
    var queries=await loadQueries();

    const curLinkBase= `/ap/entity/${entity}/${action ||""}`;

    //headerLinks=[{to:'aaa',text:'aaaa'}];
    function getCurQueryString(search?:string){
        var curQuery:any=search?uri.parseSearch(search).q:null;
        if(curQuery)
        {
            curQuery=JSON.parse(curQuery).args;
            if(curQuery)
            {
                delete curQuery.Paging;
                curQuery=JSON.stringify(curQuery);
            }
        }
        return curQuery;
    }
    function getHeadComponents(ctn,search?:string){
        var curQuery=getCurQueryString(search);
        var idx=queries.map((q,i)=>({q,i})).filter(q=>q.q.Query==curQuery);
        idx=idx.length?idx[0].i:-1;
        var actions=(headerLinks?headerLinks.map((l, i) =>
            <Link key={"l" + i} className="btn btn-primary" to={l.to} >{l.text}</Link>
            ):[]).concat(
                headActionBuilders ? lodash.flatten(headActionBuilders.map((a, i) =>
                    a.build(null, i, ()=>ctn().refresh())
            )):[]);

        
        return {
                actions:actions,
                nav:queries.map((q,i)=>
                    <li className={(idx==i?"active":"")}><Link 
                        replace={true}
                        key={i} 
                        
                        title={q.Name} 
                        to={curLinkBase + "?q="+encodeURIComponent(JSON.stringify({args:JSON.parse(q.Query)}))} >{q.Name}</Link></li>
                ),
                queryIndex:idx
            };
    }
    return {
        head: (ctn: IPageContentRefer) =>
            getHeadComponents(ctn)
        ,
        component: class EntityList extends React.Component<any,any>{
            constructor(props: any) {
                super(props);
                var re=getHeadComponents(()=>this,props.location.search);
                props.head(re.actions,re.nav);
                this.state={queryIndex:re.queryIndex};
            }
            componentWillReceiveProps(nextProps: Readonly<any>, nextContext: any){
                var re=getHeadComponents(()=>this,nextProps.location.search);
                nextProps.head(re.actions,re.nav);
                this.setState({queryIndex:re.queryIndex});
            }
            refresh() { 
                (this.refs["table"] as any).refresh();
            }
            render() {
                var q=null;
                if(this.props.location.search)
                {
                    var ps=uri.parseSearch(this.props.location.search);
                    q=ps.q || null;
                }
                var dropdownActions:any=[];
                if(this.state.queryIndex==-1 && q && q.indexOf("\"args\":{")!=-1)
                    dropdownActions.push(
                        {
                            text:"保存当前查询",
                            action:async ()=>{
                                var name=prompt("请输入查询名称");
                                if(!name)
                                    return;

                                var q=getCurQueryString(this.props.location.search);
                                if(!q)
                                    q=null;
                                await apicall.call<any>("BackEndConsoleUISetting", "Update", {},{ ConsoleId: consoleId, Path:settingPath,Name:name,Value:q});
                                queries=await loadQueries();
                                var re=getHeadComponents(()=>this,this.props.location.search);
                                this.props.head(re.actions,re.nav);
                                this.setState({queryIndex:re.queryIndex})
                            }
                        }
                    );
                if(this.state.queryIndex>0)
                    dropdownActions.push({
                        text:"删除查询("+queries[this.state.queryIndex].Name+")",
                        action:async ()=>{
                            if(!confirm("您要删除当前查询么?"))
                                return;
                            await apicall.call<any>(
                                "BackEndConsoleUISetting", 
                                "Update", 
                                {},
                                {
                                    ConsoleId: consoleId,
                                    Path:settingPath,
                                    Name:queries[this.state.queryIndex].Name,
                                    Value:null
                                });
                            queries=await loadQueries();
                            var re=getHeadComponents(()=>this,this.props.location.search);
                            this.props.head(re.actions,re.nav);
                            this.setState({queryIndex:re.queryIndex})
                        }
                    });

                return <EntityTable
                    ref="table"
                    controller={controller.Name}
                    action={listAction.Name}
                    serviceId={cfg.service}
                    className="full-page-list"
                    //titleLinkBuilder={args.titleLinkBuilder}
                    actions={actionBuilders}
                    readonly={readonly}
                    onQueryChanged={(q)=>{
                        var ps=uri.parseSearch(this.props.location.search);
                        ps.q=q;
                        var url=this.props.location.pathname+"?"+uri.buildSearch(ps);
                        this.props.history.replace(url);
                    }}
                    dropdownActions={dropdownActions}
                    query={q}
                />
            }
        }
    }
}
