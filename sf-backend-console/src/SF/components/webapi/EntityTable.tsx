﻿import * as React from 'react'
import  assign  from "../../utils/assign";
import {ApiTable, ExtraColumn} from "./ApiTable";
import * as ApiTableManager from "./ApiTableManager";
import {TableConfig} from "./ApiTableBuilder";
import {Link} from "react-router-dom";
import {buildEntityLink} from "../../utils/EntityLinkBuilder";

export interface IActionBuilder {
    textLength: number;
    build(row: any,idx:number,refresh:()=>void): JSX.Element;
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
    filterValue?: any;
}

export class EntityTable extends React.Component<EntityTableProps, {}>
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
                    return <Link key={idx}
                        className="btn btn-default btn-xs table-action"
                        to={to}>
                        {this.props.readonly || this.cfg.entityReadonly ? '详细' : '编辑'}
                    </Link>
                }, textLength: 2
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
                    var r = rows[props.rowIndex];
                    return actions.map((a, idx) =>
                        a.build(r, idx, refresh)
                    ).filter(e => !!e);
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
            filterValue={p.filterValue}
            />
    }

}
