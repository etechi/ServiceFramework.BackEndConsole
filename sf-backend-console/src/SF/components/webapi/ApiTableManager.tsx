﻿import * as React from 'react'
import * as  ApiMeta  from "../../utils/ApiMeta";
import  assign  from "../../utils/assign";
import {ApiFormManager} from "./ApiFormManager";
import * as TableBuilder from "./ApiTableBuilder";

export class ApiTableManager{
    private _forms: ApiFormManager;
    private _lib: ApiMeta.Library;
    private _tables: { [index: string]: TableBuilder.TableConfig }
    library() { return this._lib }

    table(controller: string, action: string) {
        var key = controller + "/" + action;
        var cfg = this._tables[key];
        if (!cfg) {
            var act = this._lib.action(controller, action);
            if (!act) throw "找不到动作:" + key;
            //if (act.Parameters && act.Parameters.length)
            //    this._forms.createForm(a);
            this._tables[key] = cfg =
                TableBuilder.build(
                    this._lib,
                    controller, action
                );
        }
        return cfg
    }   
    constructor(forms: ApiFormManager) {
        this._forms = forms;
        this._lib = forms.library();
        this._tables = {} as any;
    }
    
    //createTable(...actions: string[]) {
    //    actions.map(a => { 
    //        var ps = a.split('/');
    //        var act = this._lib.action(ps[0], ps[1]);
    //        if (!act) throw "找不到动作:" + a;
    //        //if (act.Parameters && act.Parameters.length)
    //        //    this._forms.createForm(a);

    //        return TableBuilder.build(this._lib, ps[0], ps[1], this._entityLinkBuilder)
    //    }).forEach(t => this._tables[t.id] = t);
    //}
}


var _mgr:ApiTableManager=null;
export function setDefaultTableManager(mgr:ApiTableManager){
    _mgr=mgr;
}
export function defaultTableManager(){
    return _mgr;
}