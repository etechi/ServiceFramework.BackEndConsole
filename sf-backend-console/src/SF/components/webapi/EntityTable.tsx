import * as React from 'react'
import  assign  from "../../utils/assign";
import {ApiTable, ExtraColumn} from "./ApiTable";
import * as ApiTableManager from "./ApiTableManager";
import {TableConfig} from "./ApiTableBuilder";
import {Link} from "react-router-dom";
import {buildEntityLink} from "../../utils/EntityLinkBuilder";
import * as lodash from 'lodash';

export interface IActionBuildResult{
    desc?:string;
    active?:boolean;
    replace?:boolean;
    primary?:boolean;
    text:string;
    to?:string;
    mode?:string;
    onClick?():void;
}
export interface IActionBuilder {
    textLength: number;
    build(row: any,idx:number,refresh:()=>void): IActionBuildResult[];
}
export interface EntityTableProps {
    controller: string;
    action: string;
    serviceId?: number;
    rowsHeight?: number;
    headerHeight?: number;
    className?: string;
    entityLinkBase?: string;
    hideQueryPanel?: boolean;
    entitySelected?: any;
    onEntitySelected?(entity: any,confirmed:boolean): void;
    onRowClick?(row: any): void;
    actions?: IActionBuilder[];
    extraColumns?: ExtraColumn[];
    linkTarget?: string;
    titleLinkBuilder?(ids: any[]): string;
    readonly?: boolean;
    query?: any;
    onQueryChanged?(q:any):void;
    dropdownActions?:{text:string,action:()=>void}[];

}

export class EntityTable extends React.Component<EntityTableProps, {dropMenuShowId?:string}>
{
    cfg: TableConfig;
    constructor(props: EntityTableProps) {
        super(props);
        this.cfg = ApiTableManager.defaultTableManager().table(this.props.controller, this.props.action);
    }

    refresh() {
        (this.refs["table"] as any).refresh();
    }
    render() {
        var p = this.props;
        var isSelectList = !!p.onEntitySelected;
        var ecs = p.extraColumns || [];
        var actions: IActionBuilder[] = (p.actions || []).slice();
        if (this.cfg.entity && this.cfg.keyColumns /*&& (!this.cfg.entityReadonly && !isSelectList || this.cfg.keyColumns.length>1)*/) {
            var keys = this.cfg.keyColumns.map(c=>c.prop.Name);
            var entity = this.cfg.entity;

            actions.unshift({
                build: (r, idx) => {
                    /*<button key={idx} type="button" className="btn btn-default btn-xs table-action" onClick={() => p.onEntitySelected(r)}>选择</button> */
                    var to = buildEntityLink(entity, keys.map(k => r[k]), this.props.serviceId);
                    if (!to)
                        return null;
                    var re:IActionBuildResult={
                        text:this.props.readonly || this.cfg.entityReadonly ? '详细' : '编辑',
                        to:to,
                        mode:'command'
                    };
                    if(!p.onEntitySelected)
                        return [re];
                    return [
                        re,
                        //<button key={idx} type="button" className="btn btn-default btn-xs table-action" onClick={() => p.onEntitySelected(r,true)}>选择</button>
                        {
                            text:"选择",
                            onClick:() => p.onEntitySelected(r,true)
                        }
                    ];
                }, textLength: p.onEntitySelected?5:2
            });
        }
        if (actions.length) {
            var refresh = () =>
                (this.refs["table"] as any).refresh();
            ecs.push({
                align: "center",
                header: "操作",
                width: 30 + 16 * actions.reduce((s,a)=>s+a.textLength,0),
                extraCell: (rows, props) => {
                    var row = rows[props.rowIndex];
                    var re=lodash.flatten(actions.map((a,i)=>a.build(row, i, refresh))).filter(a=>!!a);
                    var doms= re.map((r,idx)=>{
                        if(r.to)
                            return <Link target={p.linkTarget} key={idx}
                                className={(r.mode=="command"?"btn btn-default btn-xs table-action":"btn btn-default btn-xs table-action btn-link")}
                                to={r.to}>
                                {r.text}
                            </Link>;
                        else if(r.onClick)
                            return <button key={idx} type="button" className="btn btn-default btn-xs table-action" onClick={r.onClick}>{r.text}</button>
                    });
                    // if(!(doms.length>8))
                    //     return doms;
                    // var left=doms.splice(8);
                    // doms.push(<a className={"btn btn-default btn-xs table-action btn-link dropdown open "+(this.state && this.state.dropMenuShowId==""? "open" :"")} 
                    //     onMouseOut={(e)=>{
                    //         if(!this.refs.drop)return;
                    //         var rt=e.relatedTarget as any;
                    //         while(rt)
                    //         {
                    //             if(rt.className.indexOf("dropdown")!=-1)
                    //                 return;
                    //             rt=rt.parentNode;
                    //         }
                    //         this.setState({dropMenuShowId:""});
                            
                    //         }}>
                    //     <span onMouseOver={()=>{this.setState({dropMenuShowId:""})}}>更多</span>
                    //     <ul className= "dropdown-menu" style={{zIndex:10000}} >
                    //     {left}
                    //     </ul>
                    //     </a>)
                    return doms;
                
                }
            });
        }

        var rowClassNameGetter = !p.entitySelected ? undefined : e => (e && e.Id == p.entitySelected ? "entity-table-row-selected" : null);
        var rowClick = !p.onRowClick && !p.onEntitySelected ? null : r => {
            if (p.onRowClick) p.onRowClick(r);
            if (p.onEntitySelected && r) p.onEntitySelected(r,false);
        };
        var rowDoubleClick = !p.onEntitySelected ? null : r => {
            if (p.onEntitySelected && r) p.onEntitySelected(r, true);
        };
        return <ApiTable
            ref="table"
            controller={p.controller}
            serviceId={p.serviceId}
            rowClassNameGetter={rowClassNameGetter}
            action={p.action}
            rowsHeight={p.rowsHeight}
            headerHeight={p.headerHeight}
            className={p.className}
            entityLinkBase={p.entityLinkBase}
            hideQueryPanel={p.hideQueryPanel}
            linkTarget={p.linkTarget}
            onRowClick={rowClick}
            onRowDoubleClick={rowDoubleClick}
            extraColumns={ecs}
            titleLinkBuilder={p.titleLinkBuilder}
            query={p.query}
            onQueryChanged={p.onQueryChanged}
            dropdownActions={p.dropdownActions}
            />
    }

}
