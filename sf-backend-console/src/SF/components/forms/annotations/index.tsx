﻿import * as React from 'react'
import * as FI from "../FormItem";
import * as  ApiMeta  from "../../../utils/ApiMeta";
import * as  Meta from "../../../utils/Metadata";
interface AttrInitializer { 
    (item: FI.FormItem, values: any, ctx: FI.ItemCreateContext): void;
}
  
const attrs: { [index: string]: AttrInitializer} = { 
    ["SF.Sys.Annotations.LayoutAttribute"](item,values) {
        item.position = values.Positions;
    },
     
    ["System.ComponentModel.DataAnnotations.KeyAttribute"](item, values) {
        if (item.itemType != FI.FormItemType.Field)
            throw "关键字只能是简单字段:" + item.formField;
        (item as FI.FormField).isKeyField = true;
    },
    ["System.ComponentModel.ReadOnlyAttribute"](item, values, ctx) {
        if (values.IsReadOnly || ctx.editMode)
            item.componentProps.disabled = true;
    },
    ["System.ComponentModel.DataAnnotations.RangeAttribute"](item, values) {
        if (item.itemType == FI.FormItemType.Array) {
            var fia = item as FI.FormItemArray;
            var minCount=fia.minCount = values.Minimum;
            var maxCount=fia.maxCount = values.Maximum;
            item.validators.push((v) => {
                if (minCount && !v || v.length < minCount)
                   return `至少需要${minCount}项${item.entity.Title}`;
                return null;
            });
            return;
        }

        var isRealNumber = Meta.isRealNumber(item.type);
        var isIntNumber = Meta.isIntNumber(item.type);
        if (!isRealNumber && !isIntNumber)
            throw "Range标记只能应用于数值或数组字段";

        var min = values.Minimum;
        var max = values.Maximum;
        (item as FI.FormField).normalizers.push((v, pv) => {
            if (v === "") return v;
            if (!v) return pv;
            var cv = isIntNumber ? parseInt(v) : parseFloat(v);
            if (isNaN(cv)) return pv;
            if (cv < min) return pv;
            if (cv > max) return pv;
            return cv+"";
        });
    },
    ["System.ComponentModel.DataAnnotations.StringLengthAttribute"](item, values) {
        if (item.type!="string")
            throw "StringLength标记必须应用于字符串字段";
        if (values.MaximumLength)
            item.componentProps["maxLength"] = values.MaximumLength;
        var min = values.MinimumLength;
        if (!min) return;
        item .validators.push(v =>
            !v ? "请输入" + item.entity.Title : v.length < min ? item.entity.Title + "至少需要" + min + "个字" : null
        );
    },
    ["SF.Sys.Annotations.PasswordAttribute"](item, values) {
        if (item.type != "string")
            throw "Password标记必须应用于字符串字段";
        item.componentProps.type = "password";
    },
    ["SF.Sys.Annotations.DateAttribute"](item, values) {
        if (item.type != "datetime")
            throw "Date标记必须应用于时间类型字段"; 
        if (values.EndTime)
            item.componentProps["endTimeMode"] = true;
    },
    ["System.ComponentModel.DataAnnotations.MaxLengthAttribute"](item, values) {
        if (item.type != "string" && item.type.substring(item.type.length-2)!="[]")
            throw "MaxLength标记必须应用于字符串或数组字段";
        if (values.Length)
            item.componentProps["maxLength"] = values.Length;
    },
    ["System.ComponentModel.DataAnnotations.MinLengthAttribute"](item, values) {
        if (item.type != "string" && item.type.substring(item.type.length - 2) != "[]")
            throw "MinLength标记必须应用于字符串或数组字段";
        var type = item.type == "string" ? "字符" : "项目";
        if (values.Length)
            item.validators.push(v =>
                v && v.length && v.length < values.Length ? "至少需要" + values.Length + "个"+type : null
            );
    },
    "SF.Sys.Annotations.RelationAttribute"(item, values) {

    },
    "SF.Sys.Annotations.UserRelationAttribute"(item, values) {

    }, 
    "SF.Sys.Annotations.HtmlAttribute"(item, values, ctx) {
        if (item.itemType != FI.FormItemType.Field)
            throw "图片只能是简单字段:" + item.formField;
        (item as FI.FormField).editor = "rich-editor";
    },
    "SF.Sys.Annotations.TimeSpanAttribute"(item, values, ctx) {
        //if (item.itemType != FI.FormItemType.Field)
         //   throw "时间只能是简单字段:" + item.formField;
        (item as FI.FormField).editor = "time-editor";
    },
    "SF.Sys.Annotations.MultipleLinesAttribute"(item, values, ctx) {
        if (item.type!="string")
            throw "多行标志只能是文本字段:" + item.formField;
        item.componentProps.rows = 4;
    },
    "SF.Sys.Annotations.CopyableAttribute"(item, values, ctx) {
        if (item.type != "string")
            throw "可复制标志只能是文本字段:" + item.formField;
        item.componentProps.copyable = true;
    },
    
    "SF.Sys.Annotations.ImageAttribute"(item, values,ctx) {
        if (item.itemType != FI.FormItemType.Field)
            throw "图片只能是简单字段:" + item.formField;
        var fi = item as FI.FormField;
        fi.editor = "image-uploader";
        if (values.Small)
            item.componentProps.small= true;

        if (ctx.pathEntities.length >= 2) {

            //数组的顶层是一个空对象
            var top1 = ctx.pathEntities[ctx.pathEntities.length - 1];
            if (top1.Name!="[]")
                return;

            //在数组里,并且数组不是横向布局
            var top2 = ctx.pathEntities[ctx.pathEntities.length - 2];
            var top2Type = (top2 as any).Type;
            if (!top2Type || !Meta.isArrayType(top2Type) ||
                top2.Attributes &&
                top2.Attributes.filter(a =>
                    a.Type == "SF.Sys.Annotations.ArrayLayoutAttribute" &&
                    JSON.parse(a.Values).HertMode
                    ).length>0)
                return;
            var eType = ctx.lib.type(ctx.lib.type(top2Type).ElementType);
            //只有一个图片字段
            if (!eType || ctx.lib.allTypeProperties(eType)
                .filter(p =>
                    !p.Attributes ||
                    p.Attributes.filter(a =>
                        a.Type == "SF.Sys.Annotations.IgnoreAttribute"
                    ).length == 0
                ).length > 1)
                return;
            item.componentProps.fullWidth = true;
        }
    },
    "SF.Sys.Annotations.TreeNodesAttribute"(item, values) {
        if (item.itemType != FI.FormItemType.Array)
            throw "TreeNodes必须在数组上使用";
        item.editor = "tree-editor";
        item.formField += "[]"; 
    },
    "SF.Sys.Annotations.TableRowsAttribute"(item, values) {
        if (item.itemType != FI.FormItemType.Array)
            throw "TableRows必须在数组上使用";
        item.editor = "table-editor";
        item.formField += "[]";

        if ((!values.ColumnsPropertyName) != (!values.CellsPropertyName))
            throw item.name+ ":TableRows 必须同时定义ColumnsPropertyName和CellsPropertyName";

        item.cfgs.colsProp = values.ColumnsPropertyName;
        item.cfgs.colDescProp = values.ColumnDescriptionPropertyName;
        item.cfgs.rowDescProp = values.RowDescriptionPropertyName;
        item.cfgs.cellsProp = values.CellsPropertyName;

        

    },
    "SF.Sys.Annotations.ArrayLayoutAttribute"(item, values) {
        if (item.itemType != FI.FormItemType.Array)
            throw "ArrayLayout必须在数组上使用";
        (item as FI.FormItemArray).hertMode = values.HertMode || false
    },
    [Meta.EntityIdentAttribute](item, values, ctx) {
        if (item.itemType == FI.FormItemType.FieldSet)
            throw "关键字只能是简单字段或简单字段的数组:" + item.formField;
        if (values.MultipleKeyField) {
            if (item.name != values.MultipleKeyField)
                return;
            var props = ctx.lib.allTypeProperties(ctx.pathEntities[ctx.pathEntities.length - 1] as Meta.Type);
            var ps=props.map(p => ({ attrs: Meta.attrValues(p, Meta.EntityIdentAttribute).filter(a => a.MultipleKeyField == item.name), prop: p }))
                .filter(p => p.attrs.length > 0);
            ps.sort((x, y) => (x.attrs[0].Column || 0) - (y.attrs[0].Column || 0));
            var names = ps.map(p => p.prop.Name);
            item.componentProps.entity = values.Entity;
            item.componentProps.value = (field: any, fields: any) => {
                var obj = fields.path[fields.path.length - 1];
                return names.map(n => obj[n]);
            }

            item.editor = "entity-picker";
            return;
        }
        // //有些需要输入
        //////主键字段直接显示
        //if (Meta.attrExists(item.entity, Meta.KeyAttribute)) {
            
        //    //item.editor = "text-input";
        //    //item.componentProps.disabled = true;
        //    return;
        //}

        if (values.ScopeField) {
            var cur_type = ctx.pathEntities[ctx.pathEntities.length - 1];
            if (cur_type && cur_type.Name == "[]")
                cur_type = ctx.pathEntities[ctx.pathEntities.length - 2];
            if (cur_type && (cur_type as any).Type && Meta.isArrayType((cur_type as any).Type))
                cur_type = ctx.lib.type(Meta.arrayElementType((cur_type as any).Type));
            var prop = cur_type && ctx.lib.allTypeProperties(cur_type as any)
                .filter(p => p.Name == values.ScopeField)[0];
            if (!prop || values.ScopeValue) {
                if (!values.ScopeValue)
                    throw "在类" + (cur_type?cur_type.Name:"(未定义)") + "中找不到范围字段:" + values.ScopeField;

                var scopeField = values.ScopeField;
                item.componentProps.scopeField = scopeField;
                item.componentProps.scopeId = (field: any, rc: FI.IRenderContext) =>
                    values.ScopeValue;
            }
            else {
                item.componentProps.scopeName = prop.Title

                var scopeField = values.ScopeField;
                item.componentProps.scopeField = scopeField;
                item.componentProps.scopeId = (field: any, rc: FI.IRenderContext) =>
                    rc.path[rc.path.length - 1][scopeField] || null;
            }
        }
        if (item.itemType == FI.FormItemType.Array) {
            var ai = item as FI.FormItemArray;
            var elementType = Meta.arrayElementType(ai.type);
            if (!Meta.isAtomType(elementType))
                throw "实体标示只能用于简单类型的数组之上:" + item.formField;
            item.componentProps.mutiple = true;
       }
        else {
            item.normalizers.push((v, pv) => {
                if (!v || v == '') return null;
                return v;
            });
       }
       if (item.optional)
            item.componentProps.optional = true;
       if (!values.Entity)
           item.componentProps.dynamicEntityType = true;
       else if (values.Entity) {
           if (values.Entity.charAt(0) == '&') {
               var entityField = values.Entity.substring(1);
               item.componentProps.entity = (field: any, fields: any) =>
                   fields[entityField].value || null;
               item.componentProps.dynamicEntityType = true;
           }
           else
               item.componentProps.entity = values.Entity;
       }
       item.editor = "entity-picker";
    },
    "System.ComponentModel.DataAnnotations.DataTypeAttribute"(item, values) {
        if (item.itemType != FI.FormItemType.Field)
            throw "DataType必须在简单字段上使用";
        if (values.DataType == "Currency")
            item.componentProps.postfix = "元";
        //(item as FI.FormItemArray).hertMode = values.HertMode || false
    },
    "SF.Sys.Annotations.PropertyTypeAttribute"(item, values) {
        if (item.itemType != FI.FormItemType.Field)
            throw "动态属性必须是简单字段:" + item.formField;
        (item as FI.FormField).editor = "dyn-prop-editor";
        item.cfgs.typeSourceType = values.TypeSourceType;
        item.cfgs.typeSourceField = values.TypeSourceField;
    }
}

export function apply(item: FI.FormItem, ctx: FI.ItemCreateContext) {
    if (!item.entity.Attributes)
        return item;
    item.entity.Attributes.forEach(a => {
        if (a.Type == "SF.Sys.Annotations.IgnoreAttribute")
            return;
        var attr = attrs[a.Type];
        if (!attr)
            return;
        attr(item, a.Values ? JSON.parse(a.Values) : {},ctx);
    })
    return item;
}