﻿import * as React from 'react'
import  assign  from "../../utils/assign";
import * as  ApiMeta  from "../../utils/ApiMeta";
import * as  Meta  from "../../utils/Metadata";
import * as  FormBuilder  from "../forms/FormBuilder";
import * as  FI  from "../forms/FormItem";
import {FormManager} from "../forms/FormManager";
import * as FieldBuilder from "../forms/FieldBuilder";

function newFormItemSetFromParams(parameters: ApiMeta.Parameter[], ctx: FI.ItemCreateContext) {
    var items = parameters.map(p => FormBuilder.newFormItem("", p, p.Type, p.Optional,ctx));
    return new FI.FormItemSet("", "", "", {} as Meta.Entity, false,null, items,null);
}

function buildFormByApi(lib: ApiMeta.Library, renderProvider:FI.IRenderProvider, controller: string, action: string, itemAdjuster: FI.IItemAdjuster): FormBuilder.IBuildResult {
    var readonly = false;
    if (action.charAt(0) == '@') 
    {
        readonly = true;
        action = action.substr(1);
    }
    var act = lib.action(controller, action);
    if (!act)
        throw `在控制器${controller}中找不到动作:${action}`;
    var formItem: FI.FormItem = null;
    if (readonly)
        formItem = FormBuilder.newFormItemSetFromType("", "Result", lib.type(act.Type), null, null, { lib: lib, pathEntities: [lib.type(act.Type)], itemAdjuster: itemAdjuster });
    else if (act.Parameters.length > 1 || Meta.isAtomType(act.Parameters[0].Type))
        formItem = newFormItemSetFromParams(act.Parameters, { lib: lib, pathEntities: [], itemAdjuster: itemAdjuster });
    else if (act.Parameters.length == 1)
        formItem = FormBuilder.newFormItemSetFromType("", act.Parameters[0].Name, lib.type(act.Parameters[0].Type), null, null, { lib: lib, pathEntities: [lib.type(act.Parameters[0].Type)], itemAdjuster: itemAdjuster });
    return FormBuilder.buildForm(lib,renderProvider,controller+"/"+action,formItem);
}

function buildRenderByApi(
    renderProvider: FI.IRenderProvider,
    lib: ApiMeta.Library,
    controller: string,
    action: string,
    itemAdjuster: FI.IItemAdjuster,
    args: FormBuilder.FormCreateArgs
): FI.IRenderEntry {
    var readonly = false;
    if (action.charAt(0) == '@') {
        readonly = true;
        action = action.substr(1);
    }
    var act = lib.action(controller, action);
    if (!act)
        throw `在控制器${controller}中找不到动作:${action}`;
    var formItem: FI.FormItem = null;
    if (readonly)
        formItem = FormBuilder.newFormItemSetFromType("", "Result", lib.type(act.Type), null, null, { lib: lib, pathEntities: [lib.type(act.Type)], itemAdjuster: itemAdjuster });
    else if (act.Parameters.length > 1 || Meta.isAtomType(act.Parameters[0].Type))
        formItem = newFormItemSetFromParams(act.Parameters, { lib: lib, pathEntities: [], itemAdjuster: itemAdjuster });
    else if (act.Parameters.length == 1)
        formItem = FormBuilder.newFormItemSetFromType("", act.Parameters[0].Name, lib.type(act.Parameters[0].Type), null, null, { editMode:args.editMode, lib: lib, pathEntities: [lib.type(act.Parameters[0].Type)], itemAdjuster: itemAdjuster });

    var render = FieldBuilder.buildFields(
        renderProvider,
        lib,
        formItem,
        args.hertMode,
        args.editMode,
        args.readonly
    );
    return render;
}



export class ApiFormManager extends FormManager{ 
    private _lib: ApiMeta.Library;
    _itemAdjuester: FI.IItemAdjuster = null;
    library() {
        return this._lib;
    }
    onBuildForm(name: string, args: FormBuilder.FormCreateArgs){
        var pairs = name.split('/');
        //return buildFormByApi(this._lib, pairs[0], pairs[1], this._itemAdjuester).component(args);
        var render = this.render(name, args);
        return FormBuilder.buildFormByRender(this._lib, this, render.render, args, render.validator);
    }
    onBuildRender(name: string, args: FI.RenderCreateArgs) {

        if (name.substring(0, 5) == 'type:') {
            name = name.substring(5);
            var formItem = FormBuilder.newFormItemSetFromType(
                "",
                "",
                this._lib.type(name),
                null,
                null,
                {
                    lib: this._lib,
                    pathEntities: [],
                    itemAdjuster: null
                });

            return FieldBuilder.buildFields(
                this,
                this._lib,
                formItem,
                args.hertMode,
                args.editMode,
                args.readonly
            )
        }

        var pairs = name.split('/');
        return buildRenderByApi(this,this._lib, pairs[0], pairs[1], this._itemAdjuester,args);
    }
    constructor(lib: ApiMeta.Library, itemAdjuester: FI.IItemAdjuster) { 
        super();
        this._lib = lib;
        this._itemAdjuester = itemAdjuester;
    }
};



var _mgr:ApiFormManager=null;
export function setDefaultFormManager(mgr:ApiFormManager){
    _mgr=mgr;
}
export function defaultFormManager(){
    return _mgr;
}