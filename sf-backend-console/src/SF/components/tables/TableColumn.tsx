﻿import * as React from 'react'
import * as  Meta  from "../../utils/Metadata";
import * as  TableColumnRender  from "./TableColumnRender";
import * as   Table  from "./Table";
import {Link} from "react-router-dom";
import {buildEntityLink} from "../../utils/EntityLinkBuilder";

const defaultTypeRenderMap = {
    string: "textRender",
    datetime: "dateRender",
    bool: 'boolRender',

    int: 'fixedNumberRender',
    uint: 'fixedNumberRender',
    short: 'fixedNumberRender', 
    ushort: 'fixedNumberRender',
    long: 'fixedNumberRender',
    ulong: 'fixedNumberRender',
    byte: 'fixedNumberRender',
    sbyte: 'fixedNumberRender',

    decimal: 'realNumberRender',
    float: 'realNumberRender',
    double: 'realNumberRender',

    enum:'enumRender',
    percent:'percentRender'
}

const charWidth = 8;
interface ILinkWrapper {
    (rows: any[], render: TableColumnRender.ICellRender, ctx: TableColumnRender.IRenderExecContext): TableColumnRender.ICellRender
}
interface IEntityIdent {
    type: string;
    idents: string[];
    svc?:any
}
interface IEntityIdentGetter {
    (row: any): IEntityIdent;
}
interface ICreateContext {
    lib: Meta.Library;
    titleProp: string;
    keyProps: string[];
    entity: string;
    entityIdSet?: { [index: string]: IEntityIdentGetter };
}

export abstract class TableColumn {
    path: string;
    getter: TableColumnRender.IFieldGetter;
    prop: Meta.Property;
    title: string;
    titleWidth: number;
    order: number;
    abstract build(ctx: TableColumnRender.IRenderExecContext): Table.ColumnItem;
    constructor(prop: Meta.Property, order: number, path: string,getter: TableColumnRender.IFieldGetter) {
        this.prop = prop;
        this.order = order;
        this.title = prop.Title || prop.Name;
        this.titleWidth = TableColumnRender.calcStringRenderWidth(this.title, 200);
        this.getter = getter;
        this.path = path;
    }
}
export class TableColumnField extends TableColumn {
    render: TableColumnRender.IColumnRender;
    linkWrapper: ILinkWrapper;

    build(ctx: TableColumnRender.IRenderExecContext): Table.ColumnItem {
        if (!ctx.rows) 
            return {
                width: Math.max(50, this.titleWidth * charWidth),
                align: "left",
                header: this.title,
                cell: () => null,
                columnKey: this.path
            } as Table.Column
        
        var re = this.render.exec(this.getter, { prop: this.prop, type: ctx.lib.type(this.prop.Type) }, ctx);
        var width = Math.max(50,this.titleWidth * charWidth, ctx && re.width * charWidth || 0);
        var render = re.render;
        if (this.linkWrapper) {
            var rows = ctx.rows;
            render = this.linkWrapper(rows, render, ctx);
            }
        return {
            width: width,
            //flexGrow:w,
            align: re.align as any,
            header: this.title,
            cell: render,
            columnKey: parent + this.prop.Name
        } as Table.Column;
    }
    constructor(
        prop: Meta.Property,
        render: TableColumnRender.IColumnRender,
        order: number,
        path: string,
        getter: TableColumnRender.IFieldGetter,
        linkWrapper: ILinkWrapper
    ) {
        super(prop,order,path,getter);
        this.render = render;
        this.linkWrapper = linkWrapper;
    }
}
export class TableColumnGroup extends TableColumn {
    prop: Meta.Property;
    cols: TableColumn[];
    build(ctx: TableColumnRender.IRenderExecContext): Table.ColumnItem {
        return {
            fixed: false,
            align: "center",
            header: this.prop.Title || this.prop.Name,
            columnKey: parent + this.prop.Name,
            columns: this.cols.map(c => c.build(ctx))
        } as Table.Group;
    }
     
    constructor(prop: Meta.Property, cols: TableColumn[], order: number, path: string, getter: TableColumnRender.IFieldGetter) {
        super(prop,order,path,getter);
        this.cols = cols;
    }
}

function initIdSet(props: Meta.Property[], getter: TableColumnRender.IFieldGetter, ctx: ICreateContext) {
    var ids: { [index: string]: IEntityIdentGetter } = {};
    var eivDict: { [index: string]: { p: Meta.Property, eiv: any }[] } = {};
    props.map(p => ({
        p: p,
        eis: Meta.attrValues(p, Meta.EntityIdentAttribute),
    })).filter(p => p.eis && p.eis.length > 0).forEach(p => {
        p.eis.forEach(eiv => {
            if (!eiv.NameField)
                return;
            var ei = eivDict[eiv.NameField];
            if (!ei) eivDict[eiv.NameField] = ei = [];
            ei.push({
                p: p.p,
                eiv: eiv
            });
        });
   });

    props.forEach(p => {
        var ps = eivDict[p.Name];
        if (!ps) return;
        if (ps.length == 1) {
            var name = ps[0].p.Name;
            var idgetter = getter && ((row) => getter(row)[name]) || ((row) => row[name]);
            var entity = ps[0].eiv.Entity;
            if (entity) {
                ids[p.Name] = (row) => ({
                    type: entity || null,
                    idents: [idgetter(row)]
                });
            }
            else {
                ids[p.Name] = (row) => {
                    var v = idgetter(row) + "";
                    var vs = v.split('-');
                    return {
                        type: vs[0],
                        idents: vs.slice(1)
                    };
                }
            }
        }
        else {
            ps.sort((x, y) => (x.eiv.Column || 0) - (y.eiv.Column || 0));
            var entity = ps[0].eiv.Entity;
            var names = ps.map(p => p.p.Name);
            var idsgetter = getter && ((row) => names.map(n => getter(row)[n])) || ((row) => names.map(n => row[n]));
            var entity = ps[0].eiv.Entity;
            if (entity) {
                ids[p.Name] = (row) => ({
                    type: entity || null,
                    idents: idsgetter(row)
                });
            }
        }
    });
    ctx.entityIdSet = ids;
}

function buildColumns(path: string, getter: TableColumnRender.IFieldGetter,  props: Meta.Property[], ctx: ICreateContext) {
    //if (ctx.entityLinkBuilder)
    initIdSet(props, getter, ctx);

    var keyNames = ctx.keyProps;
    ctx.entityIdSet[""] = (row) =>
        ({
            type:null,
            idents: keyNames.map(n => row[n])
        });

    var entity = ctx.entity;
    if(entity)
        ctx.entityIdSet[ctx.titleProp] = (row) => ({
            type: entity,
            idents: keyNames.map(n => row[n])
        });

    var cols = props.map(c => buildColumn(path, getter, c, ctx)).filter(p => p != null);

    var curOrder = 0;
    cols.forEach(c => {
        if (!c.order)
        //    curOrder = c.order;
        //else
            c.order = curOrder = (curOrder || 0) + 0.01;
    });

    cols.sort((x, y) => x.order - y.order);
    return cols
}
function buildColumn(path: string, getter: TableColumnRender.IFieldGetter, prop: Meta.Property, ctx: ICreateContext): TableColumn {
    var tvs = Meta.attrFirstValue(prop, Meta.TableVisibleAttribute);
    if (!tvs)
        return null;

    path = path + prop.Name;

    var col = prop.Name;
    var getter = getter && ((row) => getter(row)[col]) || ((row) => row[col]);


    var order = tvs.Order || 0;
    var type = ctx.lib.type(prop.Type);
    if (!Meta.isAtomType(prop.Type) && !type.IsEnumType && type.Attributes) {
        var cc = buildColumns(path + "/", getter,  ctx.lib.allTypeProperties(ctx.lib.type(prop.Type)),  ctx);
        if (cc.length == 0) return null;
        return new TableColumnGroup(prop, cc, order, path, getter);
    }

    if (Meta.isArrayType(prop.Type)) {
        return new TableColumnField(prop, TableColumnRender.renders['arrayRender'], order, path, getter, renderWrapper);
    }

    var render = defaultTypeRenderMap[type.IsEnumType?"enum":Meta.attrFirst(prop,Meta.PercentAttribute)?'percent':prop.Type];
    if (!render)
        throw "找不到表格列绘制器" + prop.Type;

    var renderWrapper: ILinkWrapper = null;
    if (ctx.entityIdSet) {
        var title = ctx.titleProp == prop.Name ? ctx.entityIdSet[""] : null;
        var id = ctx.entityIdSet[prop.Name];
        if (id || title) {
            renderWrapper = (rows, render, ctx) => {
                var isSelectTable = ctx.isSelectTable;
                return (a) => {
                    var to: string;
                    if (title && ctx.titleLinkWrapper)
                    {
                        var v = title(rows[a.rowIndex]);
                        if (!v) return render(a);
                        to = ctx.titleLinkWrapper(v.idents);
                    }
                    else if (id) {
                        var v = id(rows[a.rowIndex]);
                        if (!v) return render(a);
                        var type = v.type;
                        var idents = v.idents;
                        if (type === null && v.idents.length == 1 && 'string' == typeof v.idents[0]) {
                            var s = v.idents[0];
                            var i = s.indexOf('-');
                            if (i == -1)
                                return render(a);
                            type = s.substring(0, i); 
                            idents = s.substring(i + 1).split('-');
                        }
                        to = buildEntityLink(type, idents, v.svc);
                        if (!to)
                            return render(a);
                    }
                    else
                        return render(a);
                    return isSelectTable ?
                        <Link to={to} target="_blank">{render(a) }</Link> :
                        <Link to={to}>{render(a) }</Link>
                }
            }
        }
    }
    return new TableColumnField(prop, TableColumnRender.renders[render], order, path, getter, renderWrapper);
}

export function buildTableColumns(lib: Meta.Library, resultType: Meta.Type){
    var props = lib.allTypeProperties(resultType);
    var cols = buildColumns(
        "",
        null,
        props,
        {
            lib: lib,
            titleProp: lib.getTypeTitlePropName(resultType),
            keyProps: lib.getIdentPropNames(resultType),
            entity: lib.getEntityName(resultType)
        });
    //var ns=cols.filter(c => {
    //    var ln = c.prop.Name.toLowerCase();
    //    return ln == "name" || ln == "title"
    //});
    //if (ns.length) {
    //    var id = props.filter(p => p.Name.toLowerCase() == "id")[0];
    //    if (id) {
    //        ns.forEach(n => {
    //            n.ColumnItem
    //        });
    //    }
    //}

    return cols

}