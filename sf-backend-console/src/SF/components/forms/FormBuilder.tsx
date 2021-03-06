﻿import * as React from 'react'
//import * as  lodash  from "lodash";

import * as  ApiMeta  from "../../utils/ApiMeta";
import * as  Meta from "../../utils/Metadata";

//import * as  DynamicForm  from "./DynamicForm";
//import * as RForm from 'redux-form';
import * as FI  from './FormItem';
import * as Annotations from './annotations'; 
import * as Editors from "../editors";

import * as  FieldBuilder  from "./FieldBuilder";

export interface FormCreateArgs extends FI.RenderCreateArgs{
    hideSubmitPanel?: boolean;
}


export interface IBuildResult {
    component(args: FormCreateArgs): any;
    //formNormalizer: { [index: string]: RForm.Normalizer };
}

function getStrOptionsKey(path: Meta.Entity[], name: string) {
    var l = path.length;
    var opts = null;
    if (l == 0)
        return null;
    if (name == "[]") {
        name = path[l - 1].Name;
        var e = path[l - 2];
        var t = (e as any).Type;
        if (t) return t + ":" + name;
        return e.Name + ":" + name;
    }
    else if (path[l - 1].Name == '[]') {
        var t = (path[l - 2] as any).Type;
        return t.substring(0, t.length - 2) + ":" + name;
    }
    else {
        var e = path[l - 1];
        var t = (e as any).Type;
        if (t) return t + ":" + name;
        return e.Name + ":" + name;
    }
}
function itemAdjuest(item: FI.FormItem, ctx: FI.ItemCreateContext) {
    Annotations.apply(item, ctx);
    if (ctx.itemAdjuster) {
        var key = getStrOptionsKey(ctx.pathEntities, item.entity.Name);
        if (key) 
            ctx.itemAdjuster(key,item,ctx);
    }
    item.onAdjusted();
    return item;
}


export function newFormItem(baseName: string, entity: Meta.Entity, type: string, optional: boolean, ctx: FI.ItemCreateContext) {

    if (Meta.isAtomType(type)) {
        return itemAdjuest(new FI.FormField(baseName + entity.Name, entity.Name, type, entity, optional, entity.Description, ctx), ctx);
    }
    var t = ctx.lib.type(type);
    if (t.IsEnumType)
        return itemAdjuest(new FI.FormField(baseName + entity.Name, entity.Name, type, entity, optional, entity.Description,ctx), ctx);

    if (t.IsArrayType) {
        ctx.pathEntities.push(entity);
        var item = newFormItem(baseName + entity.Name, {Name:"[]"} as any, type.substr(0, type.length - 2), false, ctx);
        ctx.pathEntities.pop();
        return itemAdjuest(new FI.FormItemArray(baseName + entity.Name, entity.Name, type, entity, optional, entity.Description,item),ctx);
    }
    //if (t.IsDictType) {
    //    ctx.pathEntities.push(entity);
    //    var item = newFormItem(baseName + entity.Name, { Name: "[]" } as any, type.substr(0, type.length - 2), false, ctx);
    //    ctx.pathEntities.pop();
    //    return itemAdjuest(new FI.FormItemDict(baseName + entity.Name, entity.Name, type, entity, optional, entity.Description, item), ctx);
    //}

    ctx.pathEntities.push(entity);
    var re = newFormItemSetFromType(baseName + entity.Name, entity.Name, t, entity.Description, entity.Title, ctx);
    ctx.pathEntities.pop();
    return re;
}



function getTypes(lib: Meta.Library, curType: Meta.Type) {
    var types = lib.allBaseTypes(curType);
    types.push(curType);
    return types;
}
function newTypeFormItems(baseName: string, type: Meta.Type, ctx: FI.ItemCreateContext) {
    if (ctx.pathEntities.length > 8)
        return [];

    var re = ctx.lib.allTypeProperties(type).filter(p=>
            !p.Attributes ||
            !p.Attributes.filter(a => a.Type == "SF.Sys.Annotations.IgnoreAttribute").length
        ).map(p =>
            newFormItem(baseName, p, p.Type, p.Optional, ctx)
        );
    //re = re.concat.apply(
    //    re,
    //    getTypes(ctx.lib, type)
    //        .filter(t => !!t.Properties)
    //        .map(t => t.Properties)
    //).filter(p => 
    //    !p.Attributes ||
    //    !p.Attributes.filter(a => a.Type == "SF.Sys.Annotations.IgnoreAttribute").length
    //).map(p =>
    //    newFormItem(baseName, p, p.Type, p.Optional,ctx)
    //); 
    return re;
}
export function newFormItemSetFromType(baseName: string, name: string, type: Meta.Type, help:string, title: string, ctx: FI.ItemCreateContext) {
    var items = newTypeFormItems(baseName && baseName + "." || "", type,ctx);
    return itemAdjuest(new FI.FormItemSet(baseName, name, type.Name, type, true, help,items,title),ctx);
}

//function formFieldAndNormalizerCollect(
//    item: FI.FormItem,
//    fields: { [index: string]: RForm.Normalizer }
//    ):void {
//    switch (item.itemType) {
//        case FI.FormItemType.Array:
//            if (item.editor && item.editor!="tree-editor") {
//                var ns = item.normalizers;
//                fields[item.formField] = ns && ns.length ? (v, pv) => ns.reduce((cv, f) => f(cv, pv), v) : null
//                break;
//            }

//            formFieldAndNormalizerCollect((item as FI.FormItemArray).item, fields);
//            break;
//        case FI.FormItemType.Field:
//            {
//                var ns = item.normalizers;
//                fields[item.formField] = ns && ns.length ? (v, pv) => ns.reduce((cv,f)=>f(cv,pv),v):null
//                break;
//            }
//        case FI.FormItemType.FieldSet:
//            (item as FI.FormItemSet).items.forEach(it => {
//                formFieldAndNormalizerCollect(it, fields);
//            });
//            break;
//    }
//}
//function getValidator(item: FI.FormItem): FI.Validator {
//    var vs = item.validators;
//    var cv = !vs || !vs.length ? null:(v,es) => vs.reduce((r, c) => r || c(v,es), null);
//    switch (item.itemType) {
//        case FI.FormItemType.Array:
//            {
//                if (item.editor)
//                    return cv;
//                var civ = getValidator((item as FI.FormItemArray).item);
//                if (civ == null) return cv;
//                return (v,es) => {
//                    if (cv) cv(v,es);
//                    return v.map(i=>civ(i,es));
//                };
//            }
//        case FI.FormItemType.Field:
//             return cv;
//        case FI.FormItemType.FieldSet:
//            {
//                var cvs = (item as FI.FormItemSet).items.map(i => ({ n: i.name, v: getValidator(i) })).filter(i => !!i.v);
//                if (cvs.length == 0) return cv;
//                return (v,es) => {
//                    if (cv) cv(v,es);
//                    return cvs.reduce((r, c) => {
//                        var e = c.v(v[c.n],es);
//                        if (e) r[c.n] = e;
//                        return r;
//                    }, {} as any);
//                };
//            }
//    }
//}

export interface IDynamicFormProps{
    help?: string;
    className?: string;
    value: any;
    onChange(value): any;
    onSubmit(value): PromiseLike<any>;
    errorPosition?: string;
    hideSubmitPanel?: boolean;
    autoSubmitTimeout?: number;
    onBuildSubmitPanel?: (prop: Editors.IBaseEditorProps, state: Editors.IFormState) => JSX.Element;

}
export function buildForm(
    lib: Meta.Library,
    renderProvider: FI.IRenderProvider,
    formName: string,
    formItem: FI.FormItem
) {
    //var result: { [index: string]: RForm.Normalizer } = {};
    //if (formItem)
    //    formFieldAndNormalizerCollect(formItem, result);
    //var fields = Object.keys(result);
    //fields.forEach(f => {
    //    if (!result[f])
    //        delete result[f];
    //});
    //console.log(formName);
    //console.log(fields);
    //var validator = formItem && getValidator(formItem) || null;
    
    var com = (args: FormCreateArgs) => {
        var render = FieldBuilder.buildFields(
            renderProvider,
            lib,
            formItem,
            args.hertMode,
            args.editMode,
            args.readonly
        )
        return class DynamicForm extends React.Component<IDynamicFormProps, {}>{
            submit() {
                return (this.refs["form"] as any).submit();
            }
            reset() {
                (this.refs["form"] as any).reset();
            }
            getFormProps(): Editors.IBaseEditorProps {
                var f = this.refs["form"] as any;
                return f ? f.getFormProps() : null;
            }
            getFormState(): Editors.IFormState { 
                var f = this.refs["form"] as any;
                return f ? f.getFormState() : null;
            }
            render() {
                const {onSubmit, onChange, value, errorPosition, hideSubmitPanel,onBuildSubmitPanel} = this.props;
                return <Editors.Form
                    ref="form"
                    className={this.props.className}
                    value={value}
                    onSubmit = { onSubmit }
                    disabled = { args.readonly }
                    onChange={onChange}
                    validateAll={render.validator}
                    render = {(prop: Editors.IBaseEditorProps, state: Editors.IFormState) => {
                        const errDom = !state.error ? null :
                            <div key="err" className="alert alert-warning"><strong>发生错误：</strong> {state.error}</div>
                        return [
                            errorPosition == "top" ? errDom : null,
                            render.render(
                                prop,
                                {
                                    path: [value],
                                    lib: lib,
                                    renderProvider: renderProvider
                                }),
                            errorPosition != "top" ? errDom : null,
                            hideSubmitPanel ? null :
                                <div key="footer" className="form-footer">
                                    {onBuildSubmitPanel && onBuildSubmitPanel(prop, state) ||
                                        <button className="btn btn-primary btn-lg" type="submit" disabled={state.submitting}>
                                        {state.submitting ? <i className="fa fa-cog fa-spin"/> : <i className="fa fa-save"/>} 保存
                                        </button>
                                    }
                                </div>
                            
                        ];
                    } }
                    />
            }
        };
    };
        //DynamicForm.buildFormComponent({
        //    formClassName: args.className,
        //    name:formName,
        //    fields: fields,
        //    validate: validator && ((d, p)=>{
        //        var es = [];
        //        var re = validator(d, es) as any;
        //        if (es.length)
        //            re._error = es.join(";");
        //        return re;
        //    }) || ((d, p) => { }),
        //    buildFields: formItem && FieldBuilder.buildFields(
        //        lib,
        //        formItem,
        //        args.hertMode,
        //        args.editMode,
        //        args.readonly
        //    ) || (fields => null),
        //    onSubmit(data: any) {
        //        alert(JSON.stringify(data)); 
        //    },
        //    hideSubmitPanel: args.hideSubmitPanel
        //});
    return {
        component: com,
        formNormalizer: null
    }
}

export function buildFormByRender(
    lib: Meta.Library,
    renderProvider: FI.IRenderProvider,
    render: FI.FormRender,
    args: FormCreateArgs,
    validator:(v:any) => Editors.MetaData
    ): any {
    return class DynamicForm extends React.Component<IDynamicFormProps, {}>{
        submit() {
           return (this.refs["form"] as any).submit();
        }
        reset() {
            (this.refs["form"] as any).reset();
        }
        getFormProps(): Editors.IBaseEditorProps {
            var f = this.refs["form"] as any;
            return f ? f.getFormProps() : null;
        }
        getFormState(): Editors.IFormState {
            var f = this.refs["form"] as any;
            return f ? f.getFormState() : null;
        }

        render() {
            const { help, onSubmit, onChange, value, errorPosition, hideSubmitPanel, onBuildSubmitPanel } = this.props;
            return <Editors.Form
                ref="form"
                className={this.props.className}
                value={value}
                help={help}
                onSubmit = { onSubmit }
                disabled = { args.readonly }
                onChange={onChange}
                validateAll={validator}
                autoSubmitTimeout={this.props.autoSubmitTimeout}
                render = {(prop: Editors.IBaseEditorProps, state: Editors.IFormState) => {
                    const errDom = !state.error ? null :
                        <div key="err" className="alert alert-warning"><strong>发生错误：</strong> {state.error}</div>
                    return [
                        errorPosition == "top" ? errDom : null,
                        render(
                            prop,
                            {
                                path: [value],
                                lib: lib,
                                renderProvider: renderProvider
                            }),
                        errorPosition != "top" ? errDom : null,
                        hideSubmitPanel || args.hideSubmitPanel ? null :
                            <div key="footer" className="form-footer">
                                {onBuildSubmitPanel && onBuildSubmitPanel(prop, state) ||
                                    <button className="btn btn-primary btn-lg" type="submit" disabled={state.submitting}>
                                        {state.submitting ? <i className="fa fa-cog fa-spin"/> : <i className="fa fa-save"/>} 保存
                                    </button>
                                }
                            </div>

                    ];
                } }
                />
        }
    };
}

export function buildFormByType(lib: Meta.Library, renderProvider: FI.IRenderProvider, type: string): IBuildResult{
    var formItem = newFormItemSetFromType("", "", lib.type(type), null, null, { lib: lib, pathEntities: [], itemAdjuster: null });
    return buildForm(lib, renderProvider, type, formItem);
}
