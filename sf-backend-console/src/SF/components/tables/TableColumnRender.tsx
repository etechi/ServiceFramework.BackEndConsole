﻿import * as React from 'react'
import * as  time  from "../../utils/time";
import * as  Meta  from "../../utils/Metadata";

export interface IFieldGetter {
    (row: any): any;
}
export interface ICellRender {
    (args: { rowIndex: number }): JSX.Element | string;
}
export interface IRenderResult {
    align: string;
    width: number;
    render: ICellRender; 
}

export interface IRenderExecContext {
    rows: any[];
    lib: Meta.Library;
    isSelectTable: boolean;
    titleLinkWrapper?(ids: any[]): string;
}
export interface IRenderExecArgument {
    prop: Meta.Property;
    type: Meta.Type;
}

export interface IColumnRender {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult
    //align(ctx: any): string; 
    //getWidth(ctx: any): number;
    //render(ctx: any, rowIndex: number): JSX.Element | string;
    //prepare(rows: any[], getter: IFieldGetter, args: any): any;
}

export function calcStringRenderWidth(s: string, max: number) {
    var w = 0;
    var l = s && s.length || 0;
    for (var i = 0; i < l; i++) {
        var c = s.charCodeAt(i);
        w += c < 0 || c > 128 ? 2 : 1;
        if (w > max)
            return max;
    }
    return w;
}
var max_width = 60;
const textRender: IColumnRender = {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult {
        var values = ctx.rows.map(r => getter(r) || "");
        var width: number;
        if (values.length < 100) {
            width = values.reduce(
                (w, v) => w == max_width ? w : Math.max(w, calcStringRenderWidth(v, max_width)),
                0);
        }
        else
        {
            width = 0;
            for (var i = 0; i < 100; i++) {
                if (width == max_width)
                    break;
                var cw = calcStringRenderWidth(values[Math.floor(i * values.length / 100)], max_width);
                if (cw > width)
                    width = cw;
            }
        }
        return {
            width: width,
            align: width <= 20 ? "center" : "left",
            render: (a) => values[a.rowIndex]
        }
    }
}

const arrayRender: IColumnRender = {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult {
        return textRender.exec(
            r => {
                var re = getter(r);
                return re && re.join(';') || '';
            },
            args,
            ctx
        );
    }
}



const dateRender: IColumnRender = {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult {
        var da=Meta.attrFirstValue(args.prop, Meta.DateAttribute);

        var values = da && da.EndTime ?
            ctx.rows.map(
                r => {
                    var v = getter(r);
                    return v ? time.formatEndDate(v) : "";
                }):
            ctx.rows.map(
                r => {
                    var v = getter(r);
                    return v ? time.format(v) : "";
                });//"Y-MM-DD HH:mm"
        return {
            align: "center",
            width: 14,
            render: (a) => values[a.rowIndex]
        }
    }
}
const boolRender: IColumnRender = {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult {
        var values = ctx.rows.map(r => getter(r) ? true : false);
        return {
            align: "center",
            width: 2,
            render: a => values[a.rowIndex] ? <span className="fa fa-check"></span> : null
        }
    }
}

function calcFixedNumberWidth(n) {
    var w;
    if (n < 0) {
        n = -n;
        w = 1;
    }
    else
        w = 0;
    for (; ;)
    {
        n = Math.floor(n / 10);
        w++;
        if (!n) break;
    }
    return w;
}
const fixedNumberRender: IColumnRender = {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult {
        var minWidth = 1000;
        var maxWidth = 0;
        var values = ctx.rows.map(r => {
            var v = getter(r) || 0;
            var cw = calcFixedNumberWidth(v);
            if (cw > maxWidth)
                maxWidth = cw;
            if (cw < minWidth)
                minWidth = cw;
            return v;
        });
        return {
            align: maxWidth == minWidth || maxWidth <= 3 ? "center" : "right",
            width: maxWidth,
            render: a => values[a.rowIndex]
        }
    }
}

const realNumberRender: IColumnRender = {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult {
        var w = 0;
        var values = ctx.rows.map((r, i) => {
            var v = getter(r) || 0;
            if (i < 100) {
                var cw = v.toString()
                if (cw.length > w)
                    w = cw.length;
            }
            return v;
        });
        return {
            align: "right",
            width: w,
            render: a => values[a.rowIndex]
        }
    }
}
const percentRender: IColumnRender = {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult {
        var w = 5;
        var values = ctx.rows.map((r, i) => {
            var v = getter(r) || 0;
            return Math.floor(v*1000)/10+"%";
        });
        return {
            align: "center",
            width: w, 
            render: a => values[a.rowIndex]
        }
    }
}

const enumRender: IColumnRender = {
    exec(getter: IFieldGetter, args: IRenderExecArgument, ctx: IRenderExecContext): IRenderResult {

        var width = 0;
        var attrs = {};
        var def_value = args.type.Properties[0].Name;
        args.type.Properties.forEach(p => attrs[p.Name] = p.Title);
        for (var k in attrs) {
            var w = calcStringRenderWidth(attrs[k], 100);
            if (w > width)
                width = w;
        }
        var values = ctx.rows.map(r => {
            var v = getter(r) || def_value;
            return attrs[v];
        });
        return {
            width: width,
            render: a => values[a.rowIndex],
            align:"center"
        };
    }
}
export const renders = {
    textRender,
    dateRender,
    boolRender,
    fixedNumberRender,
    realNumberRender,
    enumRender,
    arrayRender,
    percentRender
}
