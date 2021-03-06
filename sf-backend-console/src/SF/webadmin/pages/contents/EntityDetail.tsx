﻿import * as React from 'react'
import * as ReactRouter from 'react-router'
import { Link } from "react-router-dom";
import * as lodash from 'lodash';

import { EntityEditor } from "../../../components/webapi/EntityEditor";
import * as ApiMeta from "../../../utils/ApiMeta";
import * as Meta from "../../../utils/Metadata";
import { show as showModal } from "../../../components/utils/Modal";
import { IPageContent, IPageRender, IPageContentRefer,IPageBuildContext } from "../PageTypes";
import * as uri from "../../../utils/uri";

export default async function build( ctn: IPageContent,ctx:IPageBuildContext): Promise<IPageRender> {
    var {lib}=ctx;
    var cfg = JSON.parse(ctn.Config);
    var readonly = cfg.readonly;
    var entity = cfg.entity;
    const entityTitle = lib.getEntityTitle(entity) || entity;

    const controller = lib.getEntityController(cfg.entity);
    if (!controller)
        throw "找不到实体控制器：" + cfg.entity;

    if(!readonly)
    {

    }
    const getAction = lib.action(controller.Name, 'LoadForEdit') || lib.action(controller.Name, 'Get');
    const type = lib.type(getAction.Type);
 
    const ids = lib.getIdentPropNames(type);
    const getKey = (r: any) =>
        ids.map(id => r[id]);
    const getKeyStr = (r: any) =>
        getKey(r).join('/')

    var actionBuilders:any=[];
        //查找关联查询 
    lib.getEntities()
        .map(e=>{var c=lib.getEntityController(e);return {e:e,c:c,m:c.Methods.filter(m=>m.Name=="Query")[0]};})
        .filter(c=>c.m)
        .forEach(c=>{
            if(!ctx.permissions[c.e])
                return;
            var at=lib.type(c.m.Parameters[0].Type);
            var props=lib.allTypeProperties(at).filter(p=>lib.attrValue(p,Meta.EntityIdentAttribute).Entity==entity);
            if(props.length)
            {
                const linkBase = `/ap/entity/${c.e}/`;
                if(!actionBuilders)actionBuilders=[];
                var addLink=(title,propName)=>{
                    //%7B%22pgO%22%3A0%2C%22pgIPP%22%3A20%2C%22pgT%22%3A0%2C%22args%22%3A%7B%22PatientId%22%3A18401%7D%7D
                    //{"pgO":0,"pgIPP":20,"pgT":0,"args":{"PatientId":18401}}
                    actionBuilders.push({
                        build: (r: any, idx: any) => {
                            var id=getKeyStr(r);
                            var val=propName=="Id"?{Id:{Id:id}}:{[propName]:id};
                            var q=encodeURIComponent(JSON.stringify({args:val}));
                            return [{ desc:title,to:linkBase + "?q="+q,text:title}];
                        },
                        textLength:title.length
                    });
                }
                if(props.length==1)
                    addLink(lib.getEntityTitle(c.e) || c.e,props[0].Name);
                else
                {
                    var dstEntityTitle=lib.getEntityTitle(c.e) || c.e;
                    props.forEach(p=>{
                        var title=p.Title.replace(entityTitle,"").replace(dstEntityTitle,"")+dstEntityTitle;
                        addLink(title,p.Name);
                    });
                }
            }
        });

    return {
        component: class EntityList extends React.Component<{location:any,head:any}>{
            render() {
                return <EntityEditor
                    id={uri.getQueryValue("id",this.props.location.search)}
                    controller={controller.Name}
                    serviceId={cfg.service}
                    readonly={readonly}
                    onBuildSubmitPanel={(p, s, cmds) => {
                        var navs=null;
                        if(s.curValue && actionBuilders)
                            navs=lodash.flatten(actionBuilders.map(b=>b.build(s.curValue,1)));
                        this.props.head(
                            [
                                {dom:cmds},
                                // {
                                //     text:'帮助',
                                //     to: `/ap/entity/${entity}/help`
                                // }
                            ],navs);
                        return <div></div>;
                    }}
               />
            }
        }
    }
}
