﻿import * as React from 'react'
//import * as  lodash  from "lodash";
import * as  Meta  from "../../utils/Metadata";
import  assign  from "../../utils/assign";

import * as FI from "./FormItem";
import * as Layout from "./Layout";
//import * as  BC  from "./BasicControls";
import {FormGroup} from "./FormGroup";
import {EditBox, TextArea, CheckBox, Select} from "./Controls";
import {DatePicker} from "../utils/DatePicker";
import {ImagePicker} from "../utils/ImagePicker";
import {EntityPicker} from "../utils/EntityPicker";
import {RichEditor} from "../utils/KRichEditor";
import {TimeEditor} from "../utils/TimeEditor";
import {TreeEditor, TreeNodeConfig} from "./TreeEditor";
import {TableEditor,IColumn as TableEditorColumn} from "./TableEditor";
import * as Editors from "../editors";



export enum BuildMode {
    query,
    edit
}
function calcProps(field: Editors.IInputProps, renderContext: FI.IRenderContext, props: any) {
    var ps: any = {};
    for (var k in props) {
        var v = props[k];
        if (v instanceof Function)
            v = v(field, renderContext);
        ps[k] = v;
    }
    return ps;
}

export interface BuildContext {
    lib: Meta.Library;
    onlyHertMode: boolean;
    editMode: boolean;
    readonly: boolean;
    treeMode?: boolean;
}
export interface BuildResult {
    width?: number;
    height?: number;
    render: FI.FormRender;
    hideTitle?: boolean;
}
function getSizeClass(size: FI.ElementSize) {
    switch (size) {
        case FI.ElementSize.ExtraSmall: return "form-size-xs";
        case FI.ElementSize.Small: return "form-size-sm";
        default: return "";
    } 
}
function readonlyPropFilter(ctx: BuildContext, props: any) {
    if (!ctx.readonly) return props;
    var new_props = assign(props, { disabled: true, placeholder: null } as any);
    return new_props;
}
 

const editbox_builder = (ctx: BuildContext, item: FI.FormField) => {
    var props = readonlyPropFilter(ctx, item.componentProps);
    return {
        height: 1,
        width: props.maxLength || 0,
        render: (field: Editors.IInputProps) =>
            <EditBox  {...field} {...props}/>
    };
};

const date_picker_builder = (ctx: BuildContext, item: FI.FormField) => {
    var props = readonlyPropFilter(ctx, item.componentProps);
    return {
        height: 1,
        width:30,
        render: (field: Editors.IInputProps) =>
            <DatePicker className="form-control" {...field} {...props}/>
    };
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
const enum_picker_builder = (ctx: BuildContext,item: FI.FormField) => {
    var props = item.componentProps;
    var type = ctx.lib.type(item.type);
    var optional = item.optional;
    var options = type.Properties.filter(f => !Meta.attrExists(f, Meta.IgnoreAttribute)).map((p, idx) =>
        <option key={idx} value={p.Name}>{p.Title || p.Name}</option>
    );
    if (optional)
        options.unshift(<option key={-1} value={''}>--</option>);
    //else if (!ctx.editMode)
    //    options.unshift(<option key={-1} value={''}>{`请选择${item.entity.Title}`}</option>);
    var defaultValue = undefined;//type.Properties[0].Name;
    var editMode = ctx.editMode;
 
    
   var width=type.Properties.reduce((w, p) => Math.max(w, calcStringRenderWidth(p.Title,100)), 0);
   props = readonlyPropFilter(ctx, props);

   return {
       height: 1,
       width: width,
       render: (field: Editors.IInputProps) => {
           var newField = assign(field, {} as any);
           var value = newField.value || (editMode && !optional ? defaultValue : undefined);
           delete newField.value;
           return <Select {...newField} {...props} value={value}>
                {value?null:<option key={-1} value={''}>{`请选择${item.entity.Title}`}</option>}
               {options }
           </Select>
       }
   }
};

const image_uploader_builder = (ctx: BuildContext, item: FI.FormField) => {
    var props = readonlyPropFilter(ctx, item.componentProps);
    return {
        width: props.fullWidth ? 0 : 20,
        render: (field: Editors.IInputProps) =>
            <ImagePicker {...field} {...props}/>
    };
};

const rich_editor_builder = (ctx: BuildContext, item: FI.FormField) => {
    var props = readonlyPropFilter(ctx, item.componentProps);
    return {
        render: (field: Editors.IInputProps) =>
            <RichEditor {...field} {...props}/>
    }
};
const time_editor_builder = (ctx: BuildContext, item: FI.FormField) => {
    var props = readonlyPropFilter(ctx, item.componentProps);
    return {
        render: (field: Editors.IInputProps) =>
            <TimeEditor {...field} {...props}/>
    }
};
const entity_picker_builder = (ctx: BuildContext, item: FI.FormField)=> {
    var props = item.componentProps;
    var title = item.entity.Title;
    var name = props.name;
    props = readonlyPropFilter(ctx, props);
    if (!props.targetName)
        props.targetName = title;
    props.required = !item.optional;
    return {
        height: 1,
        render: (field: Editors.IInputProps, renderContext: FI.IRenderContext) => 
            <EntityPicker {...field} {...calcProps(field, renderContext, props) }/>
    };
}; 

const checkbox_builder = (ctx: BuildContext, item: FI.FormField)=> {
    var props = readonlyPropFilter(ctx, item.componentProps);
    return {
        height: 1,
        width:4,
        render: (field: Editors.IInputProps) =>
            <CheckBox {...field} {...props} />
    }
};

interface IDynamicPropEditorProps extends Editors.IInputProps {
    type: string;
    render: FI.FormRender;
    renderContext: FI.IRenderContext;
    lib: Meta.Library;
}
class DynamicPropEditor extends React.Component<IDynamicPropEditorProps, {}>{
    render() {
        let {render, value, lib, type, onChange, renderContext} = this.props;
        if (!render)
            return <div className="form-control">请先指定类型，再继续编辑！</div>
        if (value)
            value = JSON.parse(value);
        if (!value) value = {};
        this.props.lib.restoreDefaultValues(value, lib.type(type),true);
        var ps = assign(this.props, {
            value: value,
            onChange: (e) => {
                e.value = JSON.stringify(e.value);
                onChange(e);
            }
        });
        return render(
            ps,
            renderContext
        );
    }
}
const dyn_prop_editor = (ctx: BuildContext, item: FI.FormField)=> {
    var props = readonlyPropFilter(ctx, item.componentProps);
    var tst = item.cfgs.typeSourceType;
    var tsf = item.cfgs.typeSourceField;
    if (!tst || !tsf)
        throw "需要指定类型来源类型以及类型来源字段";
    
    return {
        render: (field: Editors.IInputProps, rc: FI.IRenderContext) => {
            var type: string;
            switch (tst) {
                case "External":
                    type = rc.path[rc.path.length - 1][tsf];
                    break;
                case "Internal":
                    type = field.value && field.value[tsf];
                default:
                    throw "不支持动态类型属性的类型来源类型：" + tst;
            }
            var render = type ? rc.renderProvider.render("type:" + type, { editMode: true, readonly: field.disabled }).render : null;
            var ps = assign(props, { renderContext: rc, render: render, type: type, lib: rc.lib });
            return <DynamicPropEditor
                {...field}
                {...ps}
                />
        }
    }
};

const tree_editor_builder = (ctx: BuildContext, item: FI.FormItemArray) => {
    if (ctx.treeMode)
        return null;
    ctx.treeMode = true;
    var cfgs: TreeNodeConfig[] = [];

    var nodeItem = item;
    for (; ;) {
        var ctnbuild = build(ctx, nodeItem.item);
        var type = Meta.arrayElementType(nodeItem.type);

        var id = (nodeItem.item as FI.FormItemSet).items.filter(it => (it as FI.FormField).isKeyField);

        var chd = (nodeItem.item as FI.FormItemSet).items.filter(it => it.editor == "tree-editor");
        if (chd.length > 1)
            throw "一个对象不支持有多个TreeView标记";
        var childProp = chd.length > 0 ? chd[0].name : null;
        cfgs.push({
            contentBuilder: ctnbuild,
            type: type,
            childProp: childProp,
            idProp: id.length > 0 ? id[0].name:null
        });
        if (chd.length == 0)
            break;
        nodeItem = chd[0] as FI.FormItemArray;
    }
    ctx.treeMode = false;

    var props = item.componentProps;
    var name = item.name;
    props = readonlyPropFilter(ctx, props);
    var title = item.entity.Title;
    return {
        width: 100,
        height: 100,
        hideTitle: true,
        render: (props: Editors.IBaseEditorProps, renderContext:any) =>
            <TreeEditor
                className={"form-" + name}
                title={title}
                key={name}
                value={props.value}
                meta={props.meta}
                onChange={props.onChange}
                nodeConfigs={cfgs}
                renderContext={renderContext}
                />
    }
};
const table_editor_builder = (ctx: BuildContext, item: FI.FormItemArray) => {
    var props = item.componentProps;
    var name = item.name;
    
    props = readonlyPropFilter(ctx, props);


    var itemSet = item.item as FI.FormItemSet;
    var items = itemSet.items;


    //item.cfgs.colsProp = values.ColumnsPropertyName;
    //item.cfgs.colDescProp = values.ColumnDescriptionPropertyName;
    //item.cfgs.rowDescProp = values.RowDescriptionPropertyName;
    //item.cfgs.cellsProp = values.CellsPropertyName;
    var dynCellBeginIndex = 0;
    var dynColBuilder:any = null;
    if (item.cfgs.cellsProp) {
        for (var l = items.length; dynCellBeginIndex < l; dynCellBeginIndex++)
           if (items[dynCellBeginIndex].key == item.cfgs.cellsProp)
                break;
        if (dynCellBeginIndex == l)
            throw "找不到表格动态单元列:" + item.cfgs.cellsProp;
        items = items.slice();
        var dynCells = items[dynCellBeginIndex];
        items.splice(dynCellBeginIndex, 1);
        var colsProp = item.cfgs.colsProp;
        dynColBuilder = (rc: FI.IRenderContext) => {
            var pnt = rc.path[rc.path.length - 1];
            var dynColProp = pnt[colsProp];
            dynColProp.map((p,i) => {
                return {
                    key: dynCells + "-" + p.Id,
                    name: p.Name,
                    help: p.Description,
                    props: {} as Editors.IBaseEditorProps,
                    render: buildContent(ctx, dynCells).render,
                    required: !dynCells.optional,
                    value: (r) => r[dynCells.key][i],
                    meta: (r) => r.child(dynCells.key).child(i),
                    onChange: (r, m, handle) => (e: Editors.ChangeEvent) =>
                        handle(
                            e.newArrayUpperEvent(i, r[dynCells.key], m.child(dynCells.key)),
                            dynCells.key
                        )
                } as TableEditorColumn;

            });
        }
    }




    Layout.sort(items);
    var cols: TableEditorColumn[] = items.map(it => {
        return {
            key: it.key,
            name: it.entity.Title,
            help:it.help,
            props: {},
            render: buildContent(ctx, it).render,
            required: !it.optional
        } as TableEditorColumn
    });
    var rowType = ctx.lib.type(itemSet.type);


    var newRow = () => {
        var re = {};
        ctx.lib.restoreDefaultValues(re, rowType);
        return re;
    };
    return {
        render: (field: Editors.IBaseEditorProps, rc: FI.IRenderContext) => {

            if (dynColBuilder) {
                var dynCols = dynColBuilder(rc);
                cols = cols.slice();
                cols.splice(dynCellBeginIndex, 0, dynCols);
            }

            return <TableEditor
                {...props}
                {...field}
                cols={cols}
                newRow={newRow}
                rowKey={(r) => r.Id}
                renderContext={rc}
                />
        }
    }
};

var editor_builders: {
    [index: string]: (ctx: BuildContext, item: FI.FormItem) => BuildResult
} = {};

editor_builders['editbox'] = editbox_builder;
editor_builders['date-picker'] = date_picker_builder;
editor_builders['enum-picker'] = enum_picker_builder;
editor_builders['image-uploader'] = image_uploader_builder;
editor_builders['entity-picker'] = entity_picker_builder;
editor_builders['checkbox'] = checkbox_builder;
editor_builders['rich-editor'] = rich_editor_builder;
editor_builders['time-editor'] = time_editor_builder;
editor_builders['tree-editor'] = tree_editor_builder;
editor_builders['dyn-prop-editor'] = dyn_prop_editor;
editor_builders['table-editor'] = table_editor_builder;

function editorWrapper(re: BuildResult, item: FI.FormItem) {
    var normalizers = item.normalizers;
    var normalizer = normalizers && normalizers.length && ((v: any, pv: any) => normalizers.reduce((cv, f) => f(cv, pv), v)) || null;
    var validators = item.validators;
    var validator = validators && validators.length && ((v: any) => {
        for (var i = 0, l = validators.length; i < l; i++) {
            var s = validators[i](v);
            if (s) return s;
        }
    }) || null;
    return assign(
        re,
        {
            render: (props: Editors.IBaseEditorProps, ctx: any) => {
                var render = (props) => {
                    return re.render(props, ctx);
                }

                return <Editors.Editor
                    {...props}
                    child={render}
                    normalizer={normalizer}
                    validator={validator}
                    />
            }
        });
}



function buildFieldRender(ctx: BuildContext, item: FI.FormField): BuildResult {
    var re:BuildResult;
    if (item.uiBuilder)
        re=item.uiBuilder(ctx, item);
    else{
        var builder = editor_builders[item.editor];
        if (!builder)
            throw "not support field build for type:" + item.type + " editor:" + item.editor;
        re=builder(ctx,item);
    }
    return editorWrapper(re, item);
}
function buildArrayRender(ctx: BuildContext, item: FI.FormItemArray): BuildResult {
    if (item.editor) {
        var builder = editor_builders[item.editor];
        if (!builder)
            throw "not support field build for type:" + item.type + " editor:" + item.editor;
        var re = builder(ctx, item);
        if (!re) return null;
        return editorWrapper(re, item);
    }

    var name = item.formField + "[]";
    var title = item.entity.Title;
    var chdBuild = build(ctx, item.item);
    var empty: any = {};
    var readonly = ctx.readonly;
    if (item.hertMode)
        return {
            height: 1,
            render: (props: Editors.IBaseEditorProps, rc: FI.IRenderContext) =>
                <Editors.ArrayEditor
                    {...props}
                    child={(items, array, props) => {
                        var crc = FI.renderContextPushPath(rc, items);
                        var re = <div className={`form-item-array hert-mode clearfix ${readonly ? 'readonly' : ''}`} >
                            {!items.length && <div className='empty'>{`没有${title}`}</div> }
                            {items.map((item, index) =>
                                <div key={index} className='array-item'>
                                    {readonly ? null : <div className= 'btn-group btn-group-xs buttons' >
                                        <button className="btn btn-default" type="button" disabled={index === 0} onClick={() => { array.move(index, 1, index - 1) } }><span className="fa fa-angle-left"></span></button>
                                        <button className="btn btn-default" type="button" disabled={index === items.length - 1} onClick={() => { array.move(index, 1, index + 2) } }><span className="fa fa-angle-right"></span></button>
                                        <button className="btn btn-default" type="button" onClick={() => { array.splice(index, 1) } }><span className="fa fa-remove"></span></button>
                                    </div>}
                                    {chdBuild(item, crc) }
                                </div>) }
                            {readonly ? null : <div className="add-panel"><button className="btn btn-default" type="button" onClick={() => { array.splice(array.length(), 0, {}) } }><span className="fa fa-plus"></span> {`添加`}</button></div>}
                        </div>;
                        rc.path.pop();
                        return re;
                    }} 
                    
             />
        };
    return {
        render: (props: Editors.IBaseEditorProps, rc: FI.IRenderContext) =>
            <Editors.ArrayEditor
                {...props}
                child={(items, array, props) => 
                {
                    var crc = FI.renderContextPushPath(rc, items);
                    return <div key={name} className={`form-item-array vert-mode ${readonly ? 'readonly' : ''} form-${name}`} label={title} {...empty} >
                        {!items.length && <div className='empty'>{`没有${title}`}</div> }
                        {items.map((child, index) => 
                            <div key={index} className='array-item'>
                                <span className="number">{index + 1}</span>
                                {readonly ? null : <div className='btn-group btn-group-xs buttons'>
                                    <button className="btn btn-default" type="button" disabled={index === 0} onClick={() => { array.move(index, 1, index - 1) } }><span className="fa fa-angle-up"></span></button>
                                    <button className="btn btn-default" type="button" disabled={index === items.length - 1} onClick={() => { array.move(index, 1, index + 2) } }><span className="fa fa-angle-down"></span></button>
                                    <button className="btn btn-default" type="button" onClick={() => { array.splice(index, 1) } }><span className="fa fa-remove"></span></button>
                                </div>}
                                {chdBuild(child, crc) }
                            </div>) }
                        {readonly ? null : <div className="add-panel">
                            {item.maxCount && items.length >= item.maxCount ? null : <button className="btn btn-default" type="button" onClick={() => { array.splice(array.length(), 0, {}) } }><span className="fa fa-plus"></span> {`添加`}</button> }
                            {items.length > 0 ? <button className="btn btn-default" type="button" onClick={() => { array.splice(0, array.length()) } }>{`清除`}</button> : null}
                        </div>}
                    </div>
                }}
                
        />
    } ;
}
function buildItemSetRender(ctx: BuildContext, item: FI.FormItemSet): BuildResult {
    var block = Layout.parseLayout(item.items, ctx.onlyHertMode);
    var bd = block.build(ctx, 0, (idx, item) => {
        var r = build(ctx, item);
        if (!r) return null;
        var name = item.name;
        return (fields, rc) => 
            r(fields[name], rc)
    });
    var fields = item.items;
    return {
        render: (props: Editors.IBaseEditorProps, rc: FI.IRenderContext) => {
            return <Editors.ObjectEditor
                 {...props}
                fields={fields}
                child={(items, props) => {
                    var crc = FI.renderContextPushPath(rc, props.value);
                    return <div className='form-item-set'>{
                        bd(items, crc) }
                    </div>;
                }}
               
            />
        }
    };
}

function buildContent(ctx: BuildContext, item: FI.FormItem): BuildResult {
    switch (item.itemType) {
        case FI.FormItemType.Array:
            return buildArrayRender(ctx, item as FI.FormItemArray);
        case FI.FormItemType.Field:
            return buildFieldRender(ctx, item as FI.FormField);
        case FI.FormItemType.FieldSet:
            return buildItemSetRender(ctx, item as FI.FormItemSet);
    }
}

function build(ctx: BuildContext, item: FI.FormItem): FI.FormRender {
    var re = buildContent(ctx, item);
    if (!re) return null;
    var render = re.render;

    var props: any = {};
    if (!re.hideTitle)
        props.label = (item as any).title || item.entity.Title;
    props.help = item.help;
    props.required = !item.optional;
    props.disabled = ctx.readonly;

    if (re.width) {
        if (re.width < 40)
            props.controlContentClass = "field-size-xs";
        else if (re.width < 100)
            props.controlContentClass = "field-size-sm";
    }
    var name = item.name;
    var preventStateClass = item.itemType != FI.FormItemType.Field || item.editor=="dyn-prop-editor";
    return (field: Editors.IBaseEditorProps, rc: FI.IRenderContext) => {
        return <FormGroup
            {...field}  
            {...props} 
            preventStateClass={preventStateClass} 
            key={name}  
            className={`field-${name}`} 
            >
            { render(field, rc) }
        </FormGroup>
    };
}

export function validate(
    renderProvider: FI.IRenderProvider,
    item: FI.FormItem,
    value: any,
    parent:any
    ): Editors.MetaData {
    var cs: any = null;
    if (value)
        switch (item.itemType) {
            case FI.FormItemType.Array:
                var citem = (item as FI.FormItemArray).item;
                for (var i: number = 0, l: number = value.length; i < l; i++) {
                    var m = validate(renderProvider, citem, value[i], value);
                    if (m) {
                        if (!cs) cs = [];
                        cs[i] = m;
                    }
                }
                break;
            case FI.FormItemType.FieldSet:
                var citems = (item as FI.FormItemSet).items;
                for (var i: number = 0, l: number = citems.length; i < l; i++) {
                    var ci = citems[i];
                    var m = validate(renderProvider, ci, value[ci.key], value);
                    if (m) {
                        if (!cs) cs = {};
                        cs[ci.key] = m;
                    }
                }
                break;
        }

    if (item.editor == "dyn-prop-editor") {
        var type: any = null;
        switch (item.cfgs.typeSourceType) {
            case "Internal":
                type = data[item.cfgs.typeSourceField];
                break;
            case "External":
                type = parent[item.cfgs.typeSourceField];
                break;
        }
        if (type) {
            var data = value ? JSON.parse(value) : {};
            if (!data)
                data = {};

            var render = renderProvider.render("type:" + type, {
                className: null,
                editMode: true,
                readonly: false,
                hertMode:false,
            });
            var m = render.validator(data);
            if (m)
                return m;
        }
    }

    var err = null;
    var validators = item.validators;
    if (validators)
        for (var i = 0, l = validators.length; i < l; i++)
            if (err = validators[i](value))
                break;
    if (!cs && !err)
        return null;
    return new Editors.MetaData(
        err,
        err?true:false,
        cs ? true:false,
        cs ? true : false,
        cs
    );
}
export function buildFields(
    renderProvider: FI.IRenderProvider,
    lib: Meta.Library,
    item: FI.FormItem,
    hertMode: boolean,
    editMode: boolean,
    readonly: boolean
 ): FI.IRenderEntry {
    var ctx = {
        lib: lib,
        onlyHertMode: hertMode,
        editMode: editMode,
        readonly:readonly
    };
    return {
        render: build(ctx, item),
        validator: v => validate(renderProvider,item, v , null)
    };
} 