﻿import * as  apicall from "./apicall";
import * as  Metadata  from "./Metadata";

export interface GrantInfo {
    UserRequired: boolean;
    RolesRequired: string[];
    PermissionsRequired: string[];
}
export interface Service extends Metadata.Entity {
    Methods: Method[];
    GrantInfo: GrantInfo;
}

export interface Method extends Metadata.TypedEntity {
    Parameters: Parameter[];
    HeavyParameter: string;
    GrantInfo: GrantInfo;
}

export interface RawLibrary extends Metadata.RawLibrary{
    Services: Service[];
}

export interface Parameter extends Metadata.Parameter {
    Optional: boolean;
    Type: string;
}

export class Library extends Metadata.Library{
    private _controllerMap: {
        [index: string]: {
            orgController: Service;
            actionMap: { [index: string]: Method }
        }
    } = {};
    private _entities: { [index: string]: {s?:Service,t?:string} };
    constructor(lib: RawLibrary) {
        super(lib);
        lib.Services.forEach(c => {
            var ic = {
                orgController: c,
                actionMap: <{ [index: string]: Method }>{}
            };
            this._controllerMap[c.Name] = ic;
            c.Methods.forEach(a => ic.actionMap[a.Name] = a);
        });

        this._entities = {};
        lib.Services
            .map(c => ({
                c: c, e: c.Attributes &&
                c.Attributes.filter(a =>
                    a.Type == "SF.Sys.Annotations.EntityManagerAttribute"
                )[0]
            })).filter(c => !!c.e)
            .forEach(c => this._entities[JSON.parse(c.e.Values).Entity] ={s:c.c});
        
        lib.Types
            .map(c => ({
                c: c, e: c.Attributes &&
                c.Attributes.filter(a =>
                    a.Type == "SF.Sys.Annotations.EntityObjectAttribute"
                )[0]
            })).filter(c => !!c.e)
            .forEach(c => {
                var v=JSON.parse(c.e.Values);
                if(v){
                    var k=v.Entity;
                    var e=this._entities[k];
                    if(!e)this._entities[k]=e={};
                    e.t=c.c.Title;
                }
            });
    }
    rawLibrary() {
        return <RawLibrary>super.rawLibrary();
    }
    getEntityController(entity: string) {
        var e= this._entities[entity];
        return e?e.s:null;
    }
    getEntities() {
        return Object.keys(this._entities);
    }
    getEntityTitle(entity: string) {
        var e= this._entities[entity];
        return e?e.t:null;
    }
    AnyAction(c: Service, ...actions: string[]) {
        return c.Methods.filter(a => actions.indexOf(a.Name.toLowerCase()) != -1)[0] || null;
    }
    isSimpleEntity(entity: string) {
        var c = this.getEntityController(entity);
        if (!c) return false;
        return c.Methods.filter(a => a.Name == "List").length > 0;
    }
    
    controller(controller: string): Service{
        var c = this._controllerMap[controller];
        return c && c.orgController || null;
    }

    action(controller: string, name: string): Method {
        var c = this._controllerMap[controller];
        if (!c) return null;
        return c.actionMap[name];
    }
    
    call<T>(controller: string, action: string, args: any, opts: apicall.ICallOptions) {
        var act = this.action(controller, action);
        if (!act) {
            throw `动作不存在${controller}/${action}`;
        }
        var query, forms;
        if (act.HeavyParameter) {
            if (act.Parameters && act.Parameters.length == 1 && act.Parameters[0].Name == act.HeavyParameter) {
                query = null;
                forms = args;
            } else {
                query = {};
                forms = {};
                if(act.Parameters)
                act.Parameters.forEach(p => {
                    var v = args[p.Name];
                    if (v === undefined)
                        return;
                    if (p.Name == act.HeavyParameter)
                        forms[p.Name] = v;
                    else
                        query[p.Name] = v;
                });
            }
        } else {
            query = args;
            forms = null;
        }

        return apicall.call<T>(
            controller,
            action,
            query,
            forms,
            opts
        );
    }
}

export function load(lib: RawLibrary): Library {
    return new Library(lib);
}

var _lib:Library=null;
export function setDefaultLibrary(lib:Library){
    _lib=lib;
}
export function defaultLibrary(){
    return _lib;
} 