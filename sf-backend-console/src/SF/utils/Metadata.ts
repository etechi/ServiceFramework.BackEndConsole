﻿import * as  apicall from "./apicall";

export interface Attribute {
    Type: string;
    Values: string;
}
export interface Entity {
    Attributes: Attribute[];
    Name: string;
    Title: string;
    Description: string;
    Group: string;
    Prompt: string;
    ShortName: string;
}
export interface TypedEntity extends Entity{
        Type: string;

}
export interface Type extends Entity {
    BaseTypes: string[];
    ElementType: string;
    IsEnumType: boolean;
    IsArrayType: boolean;
    IsDictType: boolean;
    Properties: Property[];
    DefaultValue: string;
    _$allBaseTypes: Type[];
    _$allProperties: Property[];
    _$keyProps: Property[];
    _$titleProp: Property;
    _$entity: string;
}
export interface Property extends TypedEntity {
    Optional: boolean;
}
export interface Parameter extends TypedEntity {
    Optional: boolean;
    //FromBody: boolean;
}

export function isObject(type: Type): boolean {
    if (type.IsEnumType) return false;
    if (type.IsArrayType) return false;
    if (type.Properties && type.Properties.length)
        return true;
    if (type.BaseTypes && type.BaseTypes.length)
        return true;
    return false;
}
export function getDefaultValue(type: Type, attr: Attribute | Property, editMode?: boolean): any{
    if (!type.IsEnumType || !editMode) {
        var dv = (<any>attr).DefaultValue;
        if (dv) {
            var d = JSON.parse(dv);
            return d;
        }
    }
    if (type.IsEnumType)
        return type.Properties[0].Name;
    if (isIntNumber(type.Name) || isRealNumber(type.Name))
        return 0;
    if (type.IsArrayType)
        return [];
    switch (type.Name) {
        case "string": return "";
        case "bool": return false;
        default: return null;
    }
}

export function restoreDefaultValues(lib: Library, obj: any, type: Type, editMode?: boolean) {
    lib.allTypeProperties(type).forEach(p => {
        
        var pt = lib.type(p.Type);
        var cur = obj[p.Name];
        if (cur === undefined)
        {
            if (editMode) {
                //实体标识属性不能载入默认值，默认值可能不是有效的标识
                //可选参数不能载入默认值，默认值可能不在有效范围
                if (!p.Optional && !attrExists(p, EntityIdentAttribute))
                    obj[p.Name] = getDefaultValue(pt, p, editMode);
            }
            //else {
                //if (p.Optional)
                //    obj[p.Name] = getDefaultValue(pt, p, editMode);
            //}
        }
        else if (pt.IsArrayType) {
            var it = lib.type(pt.ElementType);
            if (isObject(it))
                cur.forEach(o => restoreDefaultValues(lib, o, it, editMode));
        }
        else if (isObject(pt))
            restoreDefaultValues(lib, cur, pt, editMode);
    });
}



export interface RawLibrary{
    Types:Type[];
}
export class Library {
    private _typeMap: { [index: string]: Type } = {};
    private _rawLib: RawLibrary;

    constructor(lib: RawLibrary) {
        this._rawLib = lib;
        lib.Types.forEach(t => this._typeMap[t.Name] = t);
    }
    rawLibrary() {
        return this._rawLib;
    }
    type(name: string): Type {
        return this._typeMap[name];
    }

    attr(e: Entity, type: string): Attribute {
        if (!e.Attributes) return null;
        for (var i = 0, l = e.Attributes.length; i < l; i++)
            if (e.Attributes[i].Type == type)
                return e.Attributes[i];
        return null;
    }
    attrValue(e: Entity, type: string): any {
        var a = this.attr(e, type);
        if (!a) return {};
        return a.Values ? JSON.parse(a.Values) : {};
    }

    allBaseTypes(curType: Type): Type[] {
        if (curType._$allBaseTypes)
            return curType._$allBaseTypes.slice();
        var re: Type[] = [];
        if (!curType.BaseTypes) return re;

        var types = curType.BaseTypes.slice();
        var ct: string;
        while (ct = types.shift()) {
            var t = this.type(ct);
            re.unshift(t);
            if (t.BaseTypes)
                t.BaseTypes.forEach(bt => types.push(bt));
        }
        curType._$allBaseTypes = re;
        return re;
    }
    allTypeProperties(type: Type): Property[] {
        if (type._$allProperties)
            return type._$allProperties.slice();

        var types = this.allBaseTypes(type);
        types.push(type);
        var hash: { [index: string]: { ep: Property, epi: number } } = {};
        var props: Property[] = [];
        for (var i = 0, l = types.length; i < l; i++)
        {
            var t = types[i];
            var ps = t.Properties;
            if (!ps)
                continue;
            for (var j = 0, ll = ps.length; j < ll; j++) {
                var p = ps[j];
                var {ep, epi} = hash[p.Name] || {} as any;
                if (ep) {
                    var np = {};
                    for (var k in p)
                        np[k] = p[k];

                    p = <Property>np;
                    var attrs = [];
                    if (ep.Attributes) {
                        if (!p.Attributes)
                            p.Attributes = [];
                        else
                            p.Attributes = p.Attributes.slice();

                        for (var ki = 0, kl = ep.Attributes.length; ki < kl; ki++) {
                            var ea = ep.Attributes[ki];
                            if (!p.Attributes.filter(a => a.Type == ea.Type).length)
                                p.Attributes.push(ea);
                        }
                    }
                    props[epi] = p;
                }
                else {
                    epi = props.length;
                    props.push(p);
                }
                hash[p.Name] = { ep: p, epi:epi };
            }
        }

        type._$allProperties = props;
        return props;

    }

    restoreDefaultValues(obj: any, type: Type, fromServer?: boolean) {
        restoreDefaultValues(this, obj, type, fromServer);
    }

    detectListResultType( type: Type) {
        if (type.IsArrayType) 
            return this.type(type.ElementType);
        //try parse QueryResult
        if (!type.Properties) return null;
        if (type.Properties.length != 3) return null;
        var total = type.Properties.filter(p => p.Name == "Total");
        if (total.length != 1) return null;
        if (total[0].Type != "int") return null;

        var items = type.Properties.filter(p => p.Name == "Items");
        if (items.length != 1) return null;
        if (!isArrayType(items[0].Type)) return null;
        return this.type(items[0].Type.substring(0, items[0].Type.length - 2));
    }
    getTypeTitleProp(type: Type) {
        if (type._$titleProp)
            return type._$titleProp;
        var ps = this.allTypeProperties(type);
        var name: Property=null;
        var title: Property=null;
        var firstKey: Property=null;
        for (var i = 0, l = ps.length; i < l; i++) {
            var p = ps[i];
            if (attrExists(p, EntityTitleAttribute)) {
                type._$titleProp = p;
                return p;
            }
            if (name)
                continue;
            if (p.Name == "Name") {
                name = p;
                continue;
            }
            if (title)
                continue;
            if (p.Name == "Title") {
                title = p;
                continue;
            }
            if (firstKey)
                continue;
            if (attrExists(p, KeyAttribute))
                firstKey = p;
        }
        return type._$titleProp = name || title || firstKey || null;
    }
    getTypeTitlePropName(type: Type) {
        var tp = this.getTypeTitleProp(type);
        return tp && tp.Name || null;
    }
    getTitlePropName(type: string) {
        return this.getTypeTitlePropName(this.type(type));
    }
    getTitle(e: any, type: string) {
        var pn = this.getTitlePropName(type);
        if (pn) return e[pn];
        return e.Name || e.Title;
    }
    getEntityName(type: Type) {
        if (type._$entity)
            return type._$entity;
        var attr = attrFirstValue(type, EntityObjectAttribute);
        return type._$entity = attr && attr.Entity || null;
    }
    getIdentProps(type: Type) {
        if (type._$keyProps)
            return type._$keyProps;
        var ps = this.allTypeProperties(type);
        return type._$keyProps=ps.filter(p => attrExists(p, KeyAttribute));
    }
    getIdentPropNames(type: Type) {
        return this.getIdentProps(type).map(p => p.Name);
    }
    getIdent(e: any, type: string) {
        if (!e)
            return null;
        var eis = this.getIdentProps(this.type(type));
        if (!eis.length)
            throw `${type}未定义主键`;
        return eis.map(id => e[id.Name]);
    }
    tryGetIdent(e: any, type: string) {
        if (!e)
            return null;
        var eis = this.getIdentProps(this.type(type));
        if (!eis.length)
            return null;
        return eis.map(id => e[id.Name]);
    }
}

export function load(lib: RawLibrary): Library {
    return new Library(lib);
}



export const isIntNumber = (type: string) =>
    type == "byte" || type == "sbyte" ||
    type == "short" || type == "ushort" ||
    type == "int" || type == "uint" ||
    type == "long" || type == "ulong"
    ;
export const isRealNumber = (type: string) =>
    type == "float" || type == "double" || type == "decimal";

export const AtomTypes = [
    "string",
	"object",
	"datetime", 
	"long",
	"int",
	"short",
	"sbyte",

	"ulong",
	"uint",
	"ushort",
	"byte",
	"char",
	"decimal",
	"float",
	"double",
	"bool",
	"void"
];

export const isAtomType = (type: string) =>
    AtomTypes.indexOf(type) != -1;

export const isArrayType = (type: string) =>
    type.substring(type.length - 2) == "[]";

export const isDictType = (type: string) =>
    type.substring(type.length - 2) == "<>";

export const arrayElementType = (type: string) => {
    if (!isArrayType(type))
        throw `类型${type}不是数组`;
    return type.substring(0, type.length - 2);
}
export function attrExists(entity: Entity, type: string) {
    var attrs = entity.Attributes;
    if (!attrs) return false;
    for (var i = 0, l = attrs.length; i < l; i++)
        if (attrs[i].Type == type)
            return true;
    return false;
}
export function attrFirst(entity: Entity, type: string) {
    var attrs = entity.Attributes;
   if (!attrs) return null;
    for (var i = 0, l = attrs.length; i < l; i++)
        if (attrs[i].Type == type)
            return attrs[i];
    return null;
}
export function attrFirstValue(entity: Entity, type: string) {
    var re = attrFirst(entity, type);
    if (!re) return null;
    return re.Values ? JSON.parse(re.Values) : {};
}
export function attrValues(entity: Entity, type: string) {
    var attrs = entity.Attributes;
    if (!attrs) return [];
    var re = [];
    for (var i = 0, l = attrs.length; i < l; i++)
        if (attrs[i].Type == type )
            re.push(attrs[i].Values ? JSON.parse(attrs[i].Values) : {});
    return re;
}

export const KeyAttribute = "System.ComponentModel.DataAnnotations.KeyAttribute";
export const EntityTitleAttribute="SF.Sys.Annotations.EntityTitleAttribute";
export const EntityIdentAttribute = "SF.Sys.Annotations.EntityIdentAttribute";
export const EntityObjectAttribute = "SF.Sys.Annotations.EntityObjectAttribute";
export const TableVisibleAttribute = "SF.Sys.Annotations.TableVisibleAttribute";
export const EntityManagerAttribute = "SF.Sys.Annotations.EntityManagerAttribute";
export const EntityActionAttribute = "SF.Sys.Annotations.EntityActionAttribute";
export const EntityRelatedAttribute = "SF.Sys.Annotations.EntityRelatedAttribute";
export const CopyableAttribute = "SF.Sys.Annotations.CopyableAttribute";
export const DateAttribute = "SF.Sys.Annotations.DateAttribute";
export const PercentAttribute = "SF.Sys.Annotations.PercentAttribute";
export const IgnoreAttribute = "SF.Sys.Annotations.IgnoreAttribute";