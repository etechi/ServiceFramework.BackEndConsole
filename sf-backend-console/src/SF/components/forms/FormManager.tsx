﻿import * as React from 'react'
import  assign  from "../../utils/assign";
//import * as  Meta  from "../../utils/Metadata";
import * as  FormBuilder  from "./FormBuilder";
import * as  FI  from "./FormItem";

//import * as RForm from "redux-form";
//export class Form {
//    name: string;
//    cached: { [index: string]: any };
//    builder: (args: FormBuilder.FormCreateArgs)=>any;
//    formNormalizer: {[index: string]: RForm.Normalizer};
//}

export abstract class FormManager implements FI.IRenderProvider {
    private _renderCached: { [index: string]: FI.IRenderEntry } = {};
    private _formCached: { [index: string]: any } = {};

    render(name: string, args: FI.RenderCreateArgs): FI.IRenderEntry{
        var key = name + ":" + JSON.stringify(args || "");
        var r = this._renderCached[key];
        if (!r)
            this._renderCached[key] = r = this.onBuildRender(name, args);
        return r;
    }
    form(name: string, args: FormBuilder.FormCreateArgs): any {
        //var f = this._forms.filter(f => f.name == name)[0];
        //if (!f) throw "找不到表单:" + name;
        var key = name+":"+JSON.stringify(args || "");
        var c = this._formCached[key];
        if (!c)
            this._formCached[key] = c = this.onBuildForm(name,args);
        return c;
    }

    //normalizer() {
    //    return this._forms.reduce((re, f) => {
    //        re[f.name] = f.formNormalizer;
    //        return re;
    //    }, {} as { [index: string]: { [index: string]: RForm.Normalizer } });
    //}
    abstract onBuildForm(name: string, args: FormBuilder.FormCreateArgs): FormBuilder.IBuildResult;
    abstract onBuildRender(name: string, args: FormBuilder.FormCreateArgs): FI.IRenderEntry;
   //createForm(...forms: string[]) {
    //    forms.map(name => {
    //        var re = this.onBuildForm(name);
    //        return {
    //            name: name,
    //            cached: {},
    //            builder: re.component, 
    //            formNormalizer: re.formNormalizer,
    //        };
    //    }).forEach(f => this._forms.push(f));
    //}
};