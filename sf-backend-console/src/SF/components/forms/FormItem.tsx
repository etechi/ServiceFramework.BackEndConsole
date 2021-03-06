﻿import * as React from 'react'
import * as  Meta  from "../../utils/Metadata";
import  assign  from "../../utils/assign";

import * as Editors  from "../editors";


export interface RenderCreateArgs {
    className?: string;
    hertMode?: boolean;
    editMode?: boolean;
    readonly?: boolean;
}
export interface IRenderEntry {
    render: FormRender,
    validator(v: any): Editors.MetaData;
}
export interface IRenderProvider  {
    render(name: string, args: RenderCreateArgs): IRenderEntry
}
export interface IRenderContext {
    path: any[];
    lib: Meta.Library;
    renderProvider: IRenderProvider;
}
export function renderContextPushPath(rc: IRenderContext, value: any) {
    var path = rc.path.slice();
    path.push(value);
    return assign(rc, { path: path });
}


export interface FormRender {
    (field: Editors.IBaseEditorProps, renderContext: IRenderContext ): JSX.Element;
}

export interface Validator {
    (s: any): string;
}
export interface Normalizer {
    (v: any,pv:any): any;
}
export enum FormItemType {
    Field,
    FieldSet,
    Array
}
export enum ElementSize {
    Normal,
    Small,
    ExtraSmall
}

export interface IItemAdjuster {
    (key:string,item: FormItem, ctx: ItemCreateContext): void;
}
export interface ItemCreateContext {
    editMode?: boolean;
    pathEntities: Meta.Entity[];
    lib: Meta.Library;
    itemAdjuster: IItemAdjuster
}

export abstract class FormItem implements Editors.IObjectField{
    formField: string;
    name: string;
    entity: Meta.Entity;
    type: string;
    optional: boolean;
    position: number[];
    componentProps: any;
    elementSize: ElementSize;
    itemType: FormItemType;
    validators: Validator[] = [];
    normalizers: Normalizer[] = [];
    editor: string;
    help: string;
    key: string;
    cfgs: any = {};
    constructor(
        formName: string,
        name: string,
        type: string,
        entity: Meta.Entity,
        optional: boolean,
        help:string
    ) {
        this.entity = entity;
        this.name = name;
        this.key = name;
        this.formField = formName;
        this.type = type;
        this.optional = optional;
        this.elementSize = ElementSize.Normal;
        this.help = help;
        if (Meta.isIntNumber(type) || Meta.isRealNumber(type))
            this.elementSize = ElementSize.ExtraSmall;
             
        this.componentProps = {
            name: name,
            label: entity.Title,
            placeholder: entity.Prompt || ("请输入" + (entity.Title || name)),
            help:help
        }
    }
    onAdjusted(){
        if(this.componentProps.disabled)
            this.componentProps.placeholder="-";
    }
}

var regFloat = /^(-?\d+)(\.\d*)?$/;
var regInter = /^-?\d+$/;
function ensureNumber(it: FormField, min: number, max: number, float: boolean) {
    if(float)
        it.componentProps.filter = (v) => {
            if (!v) return "";
            if (!regFloat.test(v))
                return undefined;
            var n = parseFloat(v);
            if (isNaN(n))
                return undefined;
            if (min < max && (n < min || n > max))
                return undefined;
            return n.toString();
        };
    else
        it.componentProps.filter = (v) => {
            if (!v) return "";
            if (!regInter.test(v))
                return undefined;
            var n = parseInt(v);
            if (isNaN(n))
                return undefined;
            if (min < max && (n < min || n > max))
                return undefined;
            return n.toString();
        };

    //it.normalizers.push((v, pv) => {
    //    if (!v) return "";
    //    var n = float ? parseFloat(v) : parseInt(v);
    //    if (isNaN(n))
    //        return pv || "";
    //    if (min<max && (n < min || n > max)) return pv;
    //    return float ? v.trim() : n.toString();
    //});
}

var type_provider = {
    string: {
        ctl: "editbox",
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.showChars = true;
            
        }
    },
    datetime: {
        ctl: "date-picker",
        init(it: FormField, ctx: ItemCreateContext) {
        }
    },
    timespan: { 
        ctl: "editbox",
        init(it: FormField, ctx: ItemCreateContext) {
        }
    },
    bool: {
        ctl: 'checkbox',
        init(it: FormField, ctx: ItemCreateContext) {
            if(it.optional)
                it.componentProps.optional=true;
        }
    },

    int: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 10;
            ensureNumber(it, -256 * 256 * 256 * 128, 256 * 256 * 256 * 127,false);
        }
    },
    uint: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 10;
            ensureNumber(it, 0, 256 * 256 * 256 * 256-1, false);
        }
    },
    short: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 6;
            ensureNumber(it, -32768, 32767, false);
        }
    },
    ushort: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 6;
            ensureNumber(it, 0, 65535, false);
       }
    },
    long: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 20;
            ensureNumber(it, -Math.pow(2,63),Math.pow(2,63), false);
        }
    },
    ulong: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 20;
            ensureNumber(it, 0, 2 ^ 63, false);
        }
    },
    byte: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 3;
            ensureNumber(it, 0, 255, false);
        }
    },
    sbyte: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 4;
            ensureNumber(it, -128, 127, false);
        }
    },

    decimal: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 20;
            ensureNumber(it, 0, 0, true);
        }
    },
    float: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 20;
            ensureNumber(it, 0, 0, true);
        }
    },
    double: {
        ctl: 'editbox',
        init(it: FormField, ctx: ItemCreateContext) {
            it.componentProps.maxLength = 20;
            ensureNumber(it, 0, 0, true);
        }
    },
    enum: {
        ctl: 'enum-picker',
        init(it: FormField, ctx: ItemCreateContext) {
        }
    },
    object: {
        ctl: 'dyn-prop-editor',
        init(it: FormField, ctx: ItemCreateContext) {
        }
    }
}
export class FormField extends FormItem {
    isKeyField: boolean;
    uiBuilder: (ctx: any, item: FormField) => any;
    constructor(
        formName: string,
        name: string,
        type: string,
        entity: Meta.Entity,
        optional: boolean,
        help:string,
        ctx: ItemCreateContext
    ) {
        super(formName, name, type, entity, optional,help);
        this.itemType = FormItemType.Field;

        var t = ctx.lib.type(type);
        var edit_type:string = null;
        if (t.IsEnumType)
            edit_type = "enum";
        else {
            
            edit_type = type;
        }

        if (!optional) {
            if (type == "bool")
                this.validators.push(v => !this.componentProps.disabled  && v === undefined ? "请输入" + entity.Title : null);
            else
                this.validators.push(v => this.componentProps.disabled || v || typeof(v)=='number' ? null : "请输入" + entity.Title);
            this.componentProps.required = true;
        }

        var editor = type_provider[edit_type];
        if (!editor)
            throw `找不到类型:${edit_type}的编辑器`;
        this.editor = editor.ctl;
        editor.init(this, ctx);
    }
    
}
export class FormItemSet extends FormItem {
    items: FormItem[];
    title: string;
    constructor(
        formName: string,
        name: string,
        type: string,
        entity: Meta.Entity,
        optional: boolean,
        help: string,
        items: FormItem[],
        title: string
    ) {
        super(formName, name, type, entity, optional, help);
        this.itemType = FormItemType.FieldSet;
        this.items = items;
        this.title = title;
        this.componentProps.help=help
    }
}

export class FormItemArray extends FormItem {
    item: FormItem;
    minCount: number;
    maxCount: number;
    hertMode: boolean;
    constructor(

        formName: string,
        name: string,
        type: string,
        entity: Meta.Entity,
        optional: boolean,
        help: string,
        item: FormItem
    ) {
        super(formName, name, type, entity, optional,help);
        this.itemType = FormItemType.Array;
        this.item = item
    }
}