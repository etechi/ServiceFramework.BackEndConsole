﻿import * as React from 'react'
import assign from '../../utils/assign';
import * as  ApiMeta  from "../../utils/ApiMeta";
import * as  apicall  from "../../utils/apicall";
import {Modal} from "./Modal";
import {EntityTable} from "../webapi/EntityTable";
import {Link} from "react-router-dom";
import {buildEntityLink} from "../../utils/EntityLinkBuilder";
import {showEntityTableModal,showEntityModal} from "./EntityModal";
import { isNullOrUndefined } from 'util';

function treeSort(items: any[], parentField: string) {
    var roots = [];
    var dict = [];
    items.forEach(i => dict[i.Id] = i);
    items.forEach(i => {
        if (i[parentField]) {
            var p = dict[i[parentField]];
            if (!p.children) p.children = [];
            p.children.push(i);
        }
        else
            roots.push(i);
    });
    if (items.some(i => i.Order)) {
        var sort_children = (items: any[]) => {
            items.sort((x, y) => x.Order - y.Order);
            items.map(i => i.children).filter(i => i != null).forEach(sort_children);
        }
        sort_children(roots);
    }
    return roots;
}
const prefix = "　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　";
function dumpOptions(items: any[], options: { value: any, text: string }[], lev: number=0) {
    items.forEach(i => {
        options.push({value:i.Id,text:prefix.substring(0, lev) + (i.Name || i.Title) });
        if (i.children)
            dumpOptions(i.children, options, lev + 1);
    });
}

function prepareTreeOptions(act: ApiMeta.Method, items: any[]) {
    var lib = ApiMeta.defaultLibrary();
    var type = lib.type(lib.type(act.Type).ElementType);
    var pid = lib.allTypeProperties(type).filter(p =>
        !lib.attr(p, "System.ComponentModel.DataAnnotations.KeyAttribute") &&
        lib.attrValue(p, "SF.Sys.Annotations.EntityIdentAttribute").IsTreeParentId
    )[0] 
    if (!pid)
        return items.map(i => ({ value: i.Id, text: lib.getTitle(i, type.Name) } as SelectOption));

    var roots = treeSort(items, pid.Name);
    var re: SelectOption[] = [];
    dumpOptions(roots, re, 0);
    return re;
}
interface SelectOption {
    value: string;
    text: string;
}

export interface EntityPickerProps {
    className?: string;
    scopeName?: any;
    scopeId?: any;
    scopeField?: string;
    value?: any;
    initialValue?: any
    onChange?(e: any): void;
    entity: string;
    targetName?: string;
    placeholder?: string;
    mutiple?: boolean; //是否为多选控件
    disabled?: boolean;
    required?: boolean;
    dynamicEntityType?: boolean;
    maxLength?: number;
}

function prepareSmallListOptions(scopeId: any, scopeField: string,entity:string) {
    if (scopeId === null)
        return Promise.resolve([] as SelectOption[]);
    var lib = ApiMeta.defaultLibrary();
    var c = lib.getEntityController(entity);
    var act = lib.action(c.Name, "List");
    var args = {};
    if (act.HeavyParameter) {
        args[scopeField] = scopeId;
    }
    else if (act.Parameters && act.Parameters.length)
        args[/*scopeField || */act.Parameters[0].Name] = scopeId;
    //args["ParentId"] = scopeId;
    return lib.call(c.Name, "List", args, null).then((re: any) =>
        prepareTreeOptions(act, re)
    );
}

function loadEntity(value: any, entity: string, propEntity:string,dynamicEntityType: boolean) {
    if (!value)
        return Promise.resolve({ text: null });

    if (dynamicEntityType) {
        if (typeof value != "string") 
            return Promise.resolve({ text: "ID类型错误" });

        var i = value.indexOf('-');
        if (i == -1)
            return Promise.resolve({ text: "ID格式错误" });

        entity = value.substring(0, i);

        if (propEntity && entity != propEntity)
            return null;

        value = value.substring(i + 1);
    }


    var lib = ApiMeta.defaultLibrary();
    var c = lib.getEntityController(entity);
    if (!c) 
        return Promise.resolve({ text: "不支持类型:" + entity });

    var act = lib.AnyAction(c, "get", "getasync");
    var args: any = {};
    var values = value instanceof Array ? value : (value + '').split('-');
    act.Parameters.forEach((p, i) => args[p.Name] = values[i]);
    return apicall.call(c.Name, act.Name, null,args, null).then((re: any) => {
        if (!re)
            return {
                text: "找不到：" + entity + "-" + value,
                ident: null,
                entity: entity
            };
        var ident = lib.getIdent(re, act.Type);
        var text = lib.getTitle(re, act.Type) || entity + "-" + ident.join("-");
        if (!propEntity)
            text = entity + ":" + text;
        return {
            text: text,
            ident: ident,
            entity: entity
        };
    });
}


interface SmallSingleEntityPickerState {
    obj?: {
        text?: string;
        entity?: string;
        ident?: any;
        svc?:any
    };
    options?: SelectOption[];
}

class SmallSingleEntityPicker extends React.Component<EntityPickerProps, SmallSingleEntityPickerState > {
    load(scopeId: any, scopeField: string, entity: string) {
        if (this.props.disabled) {
            var re = loadEntity(this.props.value, entity, this.props.entity, this.props.dynamicEntityType);
            if (re)
                re.then(r => this.setState({ obj: r }));
            return;
        }
        prepareSmallListOptions(scopeId, scopeField, entity).then((re: SelectOption[]) => {
            if (this.props.dynamicEntityType)
                re = re.map(i => ({ text: i.text, value: this.props.entity + "-" + i.value }));
            this.setState({
                options: re
            })
        });
    } 
    componentDidMount() {
        this.load(this.props.scopeId, this.props.scopeField, this.props.entity);
    }
    componentWillReceiveProps(nextProps: EntityPickerProps, nextContext: any): void {
        //if (nextProps.scopeId != this.props.scopeId || nextProps.value != this.props.value) {
        //    console.log(`${(this.props as any).label} 属性改变，OS:${this.props.scopeId} NS:${nextProps.scopeId} OV:${this.props.value} NV:${nextProps.value}`);
        //}
        if (nextProps.scopeId != this.props.scopeId || nextProps.entity != this.props.entity) {
            this.setState({ options: null });
            if (this.props.value && !nextProps.value)
                this.props.onChange("");
            this.load(nextProps.scopeId, nextProps.scopeField, nextProps.entity);
        }
    }
    render() {
        var p = this.props;
        if (p.disabled) {
            var obj = this.state && this.state.obj;
            var to = obj && obj.ident && obj.entity ? buildEntityLink(obj.entity, obj.ident,obj.svc) : null;
            return <div className={`form-control small-single entity-picker readonly ${p.className || ''}`}>
                {!obj ? "选项读取中..." : to ? <Link to={to}>{obj.text}</Link> : obj.text}
            </div>;
        }

        var opts = this.state && this.state.options;
        if (!opts)
            return <div className={`form-control small-single entity-picker ${p.className || ''}`}>选项读取中...</div>;

        var firstElement = !p.required ?
            <option key='-1' value=""> -- </option>
            : !p.value && !p.initialValue ? <option key='-1' value="" className="placeholder"> { this.props.scopeId === null ? "请先选择" + this.props.scopeName : this.props.placeholder || "" }</option> : null
            ;

        return <select
            value={p.value || ""}
            //initialValue={p.initialValue || undefined}
            disabled={p.disabled}
            className={`form-control small-single entity-picker loading ${p.className || ''}`}
            onChange={(e) => p.onChange((e.target as any).value) }
            
            >
            {firstElement}
            {opts.map(it => <option key={it.value} value={it.value}>{it.text}</option>) }
        </select>;
    } 
}


interface LargeSingleEntityPickerState {
    text?: string;
    modalVisible?: boolean;
    selectController?: string;
    selectAction?: string;
    entity?: string;
    ident?: any[];
    svc?:any

}
class LargeSingleEntityPicker extends React.Component<EntityPickerProps, LargeSingleEntityPickerState > {
    constructor(props: EntityPickerProps) {
        super(props);
        this.state = {};
    }
    load(scopeId: any, entity: string, value: any) {
        var re = loadEntity(value, entity, this.props.entity, this.props.dynamicEntityType);
        if (!re) {
            this.props.onChange(null);
            return;
        }
        re.then(re => this.setState(re));

        //if (!value) {
        //    this.setState({ text: null });
        //    return;
        //}

        //if (this.props.dynamicEntityType) {
        //    if (typeof value != "string") {
        //        this.setState({ text: "ID类型错误" });
        //        return;
        //    }
        //    var i = value.indexOf('-');
        //    if (i == -1) {
        //        this.setState({ text: "ID格式错误" });
        //        return;
        //    }
        //    entity = value.substring(0, i);

        //    if (this.props.entity && entity != this.props.entity) {
        //        this.props.onChange(null);
        //        return;
        //    }

        //    value = value.substring(i + 1);
        //}


        //var lib = ApiMeta.defaultLibrary();
        //var c = lib.getEntityController(entity);
        //if (!c) {
        //    this.setState({ text: "不支持类型:"+entity });
        //    return;
        //}
        //var act = lib.AnyAction(c, "get", "getasync");


        //var args: any = {};
        //var values = (value + '').split('-');
        //act.Parameters.forEach((p, i) => args[p.Name] = values[i]);
        //apicall.call(c.Name, act.Name, args, null, null).then((re: any) => {
        //    if (!re) {
        //        this.setState({
        //            text: "找不到："+entity+"-"+value,
        //            ident: null,
        //            entity: entity
        //        });
        //    }
        //    var ident = lib.getIdent(re, act.Type);
        //    var text = lib.getTitle(re, act.Type) || entity + "-" + ident.join("-");
        //    if (!this.props.entity)
        //        text = entity + ":" + text;
        //    this.setState({
        //        text: text,
        //        ident: ident,
        //        entity:entity
        //    });
        //});
    }
    selectActionDetect(entity: string) {
        if (!entity) return;
        var lib = ApiMeta.defaultLibrary();
        var c = lib.getEntityController(entity);
        this.setState({
            selectController: c?c.Name:null,
            selectAction: c?"Query":null
        });
    }
    componentDidMount() {
        this.selectActionDetect(this.props.entity);
        this.load(this.props.scopeId, this.props.entity, this.props.value || this.props.initialValue);
    }
    componentWillReceiveProps(nextProps: EntityPickerProps, nextContext: any): void {
        //if (nextProps.scopeId != this.props.scopeId || nextProps.value != this.props.value) {
        //    console.log(`${(this.props as any).label} 属性改变，OS:${this.props.scopeId} NS:${nextProps.scopeId} OV:${this.props.value} NV:${nextProps.value}`);
        //}
        if (nextProps.entity != this.props.entity && this.props.value) {
            this.props.onChange(null);
            return;
        }
        this.selectActionDetect(nextProps.entity);

        if (nextProps.scopeId != this.props.scopeId) 
        {
            this.setState({ text: "" });
            if (this.props.value)
                this.props.onChange("");
        }
        else if (nextProps.value != this.props.value) {
            this.setState({text: undefined});
            this.load(nextProps.scopeId, nextProps.entity, nextProps.value);
        }
    }
    showModal() {
        var p=this.props;
        if (p.disabled) return;
        var s=this.state;
        
        showEntityTableModal(
            {
                controller:s.selectController,
                action:s.selectAction,
                entityIdent:this.props.value || null,
                title: `选择${p.targetName}`,
                query: this.props.scopeId ? JSON.stringify({args:JSON.stringify({ [this.props.scopeField]: this.props.scopeId}) }):null
            //    onChange={id => {
            //        this.props.onChange(!id?null:this.props.dynamicEntityType ? this.props.entity+"-"+id: id);
            //        this.setState({ modalVisible: false });
            //    } }
            //    onClose={() => this.showModal(false) }
            }).promise.then(id=>{
                if(id===undefined)
                    return;
                this.props.onChange(!id?null:this.props.dynamicEntityType ? this.props.entity+"-"+id: id);
            });
        //this.setState({ modalVisible: visible });
    }
    render() {
        var p = this.props;
        var s = this.state;
        var text = s.text;
        if (text === undefined)
            return <div className={`form-control large-single entity-picker loading ${p.className || ''} ${p.disabled ? 'disabled' : ''}`}>读取中...</div>;
        if (text && !s.ident)
            return <div className={`form-control large-single entity-picker error ${p.className || ''} ${p.disabled ? 'disabled' : ''}`}>{s.text}</div>;

        var to = text && p.disabled ? buildEntityLink(s.entity, s.ident,s.svc) : null;
        var ctn = to ? <Link to={to }>{text}</Link> : text;

        return <div className={`input-group large-single entity-picker ${p.className || ''} ${p.disabled?'disabled':''}`}>
            <div className="form-control">
                {ctn}
                {!ctn && !p.disabled && p.placeholder ? <span className="placeholder">{p.placeholder}</span>:null}
            </div>
            {p.disabled || !s.selectController ? null : <span className="input-group-btn">
                <button disabled={this.props.disabled} onClick={() => this.showModal() } className="btn btn-default" type="button"><span className="fa fa-search"></span></button>
            </span>}
        </div>;
    }
}
 //{s.modalVisible && s.selectController ? <EntityDialog
            //    controller={s.selectController}
            //    action={s.selectAction}
            //    entityIdent={this.props.value || null}
            //    title={`选择${p.targetName}`}
            //    onChange={id => {
            //        this.props.onChange(!id?null:this.props.dynamicEntityType ? this.props.entity+"-"+id: id);
            //        this.setState({ modalVisible: false });
            //    } }
            //    onClose={() => this.showModal(false) }
            //    /> : null}


//interface EntityDialogProps {
//    title: string;
//    controller: string;
//    action: string;
//    onChange(id: any): void;
//    onClose(): void;
//    entityIdent: any;
//}
//interface EntityDialogState{
//    selectedIdent: any;
//}
//class EntityDialog extends React.Component<EntityDialogProps, EntityDialogState>{
//    constructor(props: EntityDialogProps) {
//        super(props);
//        this.state = { selectedIdent: props.entityIdent };
//    }
//    render() {
//        var footer = <div className="text-right">
//            <button className="btn btn-primary btn-sm" type="button" disabled={!this.state.selectedIdent} onClick={() => this.props.onChange(this.state.selectedIdent || null) }>确定</button>
//            <button className="btn btn-default btn-sm" type="button" disabled={!this.state.selectedIdent} onClick={()=>this.props.onChange(null)}>清除</button>
//            <button className="btn btn-default btn-sm" type="button" onClick={this.props.onClose}>关闭</button>
//        </div>
//        return <Modal id="entityDialog" minWidth="90%" height="90%" title={this.props.title} onClose={this.props.onClose} footer={footer}>
//            <EntityTable
//                controller={this.props.controller}
//                action={this.props.action}
//                entitySelected={this.state.selectedIdent}
//                linkTarget="_blank"
//                onEntitySelected={(e) => this.setState({ selectedIdent: e ? e.Id : null }) }
//                />
//        </Modal>
//    }
//}

class SmallMultipleEntityPicker extends React.Component<EntityPickerProps, { options: SelectOption[] }> {

    load(scopeId: any, scopeField: string, entity: string) {
        prepareSmallListOptions(scopeId, scopeField, entity).then((re: SelectOption[]) =>
            this.setState({
                options: re
            })
        );
    }
    componentDidMount() {
        this.load(this.props.scopeId, this.props.scopeField, this.props.entity);
    }
    componentWillReceiveProps(nextProps: EntityPickerProps, nextContext: any): void {
        //if (nextProps.scopeId != this.props.scopeId || nextProps.value != this.props.value) {
        //    console.log(`${(this.props as any).label} 属性改变，OS:${this.props.scopeId} NS:${nextProps.scopeId} OV:${this.props.value} NV:${nextProps.value}`);
        //}
        if (nextProps.scopeId != this.props.scopeId) {
            this.setState({ options: null });
            if (this.props.value && this.props.value.length)
                this.props.onChange([]);
            this.load(nextProps.scopeId, nextProps.scopeField, nextProps.entity);
        }
    }

    render() {
        var p = this.props;
        var opts = this.state &&  this.state.options;
        if (!opts)
            return <div className={`form-control small-multiple entity-picker ${p.className || ''}`}>选项读取中...</div>;
        var ovs = p.value || p.initialValue;
        if (!(ovs instanceof Array))
            ovs = [];
        var items = opts.map(it => {
            var active = ovs.indexOf(it.value) == -1;
            return <li className={active ? "active" : null} key={it.value} onClick={() => {
                if (p.disabled) return;
                var vs = ovs.slice();
                var idx = vs.indexOf(it.value);
                if (idx == -1)
                    vs.push(it.value);
                else
                    vs.splice(idx, 1);
                p.onChange(vs);
            } }>
                <span className={active ? 'fa fa-square-o' : 'fa fa-check-square-o'}></span> <span>{it.text}</span>
            </li>
        });
        return <ul
            className={`form-control small-multiple entity-picker ${p.className || ''}`}
            >
            {items.length?items:<li><span>没有可用的选项</span></li> }
        </ul>;
    }
}

interface LargeMultipleEntityPickerState {
    texts?: string[];
    valueVersion?: number;
    selectController?: any;
    selectAction?: any;
    modalVisible?: boolean;
    noscroll?: boolean;
}
interface ICacheEntiy{
     text:string;
    entity:string;
    controller:string;
    action:string;
    id:string
}
class LargeMultipleEntityPicker extends React.Component<EntityPickerProps, LargeMultipleEntityPickerState> {
    constructor(props: EntityPickerProps) {
        super(props);
        this.state = {
            texts: [],
            valueVersion:0
        };
    }
    updateText(idx: number, text: string) {
        var texts = this.state.texts.slice();
        texts[idx] = text;
        this.setState({ texts: texts });
    }
    _text_cache:{[index:string]:ICacheEntiy}={};

    loadValue(entity:string,value: any, index: number) {
        if (!value) {
            return null;
        }
        var ctext = this._text_cache[value];
        if (ctext)
            return ctext.text as any;

        var orgValue = value;

        if (this.props.dynamicEntityType) {
            if (typeof value != "string")
                return "ID类型错误";

            var i = value.indexOf('-');
            if (i == -1) 
                return "ID格式错误";

            entity = value.substring(0, i);

            //if (this.props.entity && entity != this.props.entity) {
            //    this.props.onChange(null);
            //    return false;
            //}

            value = value.substring(i + 1);
        }


        var lib = ApiMeta.defaultLibrary();
        var c = lib.getEntityController(entity);
        if (!c) 
            return "不支持类型:" + entity;

        var act = lib.AnyAction(c, "get", "getasync");
        var args: any = {};
        var values = (value + '').split('-');
        act.Parameters.forEach((p, i) => args[p.Name] = values[i]);

        return apicall.call(c.Name, act.Name, null, args, null).then((re: any) => {
            if (!re) {
                return { index: index, text: "找不到：" + entity + "-" + value };
            }
            var ident = lib.getIdent(re, act.Type);
            var text = lib.getTitle(re, act.Type) || entity + "-" + ident.join("-");
            if (!this.props.entity)
                text = entity + ":" + text;
            this._text_cache[orgValue] = {text:text,entity:entity,controller:c.Name,action:act.Name,id:orgValue};
            return { index: index, text: text };
        });
    }
    load(scopeId: any, entity: string, values: any[]) {
        var vv = this.state.valueVersion + 1;
        if (!values || !values.length) {
            this.setState({ texts: [], valueVersion: vv });
            return;
        }
        var re = values.map((v, i) => this.loadValue(entity, v, i));
        var texts = re.map(r => !r || 'string' == typeof r ? r : "载入中...");
        this.setState({ texts: texts, valueVersion: vv });
        Promise.all(re.filter(r => r && 'string' != typeof r)).then(re => {
            if (vv != this.state.valueVersion)
                return;
            var texts = this.state.texts.slice();
            re.forEach(r =>
                texts[r.index] = r.text
            );
            this.setState({ texts: texts });
        });
    }
    selectActionDetect(entity: string) {
        if (!entity) return;
        var lib = ApiMeta.defaultLibrary();
        var c = lib.getEntityController(entity);
        this.setState({
            selectController: c ? c.Name : null,
            selectAction: c ? "Query" : null
        });
    }
    componentDidMount() {
        this.selectActionDetect(this.props.entity);
        this.load(this.props.scopeId, this.props.entity, this.props.value || this.props.initialValue);
    }
    componentWillReceiveProps(nextProps: EntityPickerProps, nextContext: any): void {
        //if (nextProps.scopeId != this.props.scopeId || nextProps.value != this.props.value) {
        //    console.log(`${(this.props as any).label} 属性改变，OS:${this.props.scopeId} NS:${nextProps.scopeId} OV:${this.props.value} NV:${nextProps.value}`);
        //}
        if (nextProps.entity != this.props.entity && this.props.value) {
            this._text_cache = {};
            this.props.onChange(null);
            return;
        }
        this.selectActionDetect(nextProps.entity);

        if (nextProps.value != this.props.value) {
            this.load(nextProps.scopeId, nextProps.entity, nextProps.value);
        }
    }
    showModal() {
        var p=this.props;
        if (p.disabled) return;
        var s=this.state;
        
        showEntityTableModal(
            {
                controller:s.selectController,
                action:s.selectAction,
                entityIdent:null,
                title:`选择${p.targetName}`,
            //    onChange={id => {
            //        this.props.onChange(!id?null:this.props.dynamicEntityType ? this.props.entity+"-"+id: id);
            //        this.setState({ modalVisible: false });
            //    } }
            //    onClose={() => this.showModal(false) }
            }).promise.then(id=>{
                if(id)
                    this.handleModalSelected(id);
                //this.props.onChange(!id?null:this.props.dynamicEntityType ? this.props.entity+"-"+id: id);
            });
        //this.setState({ modalVisible: visible });
    }
    handleModalSelected(id: any) {
        this.setState({ modalVisible: false });
        if (!id)return;
        var vs = this.props.value && this.props.value.slice() || [];
        vs.push(this.props.dynamicEntityType ? this.props.entity + "-" + id : id);
        this.props.onChange(vs);
    }
    clear() {
        if (!confirm("您确定要清除列表项目么?在保存前可以通过重置来撤销此操作"))
            return;
        this.props.onChange(null);
    }
    showEntity(v:any){
        var c=this._text_cache[v];
        if(!c)return;

        showEntityModal({
            title:c.text,
            controller:c.controller,
            action:c.action,
            entity:c.entity,
            ident:c.id
        });
    }
    render() {
        var s = this.state;
        var p = this.props;
        var vs = (p.value || []);
        return <div
            className={`form-control large-multiple entity-picker ${p.className || ''}`}
            ><ul style={{ overflow: s.noscroll ? 'visible' : 'auto', maxHeight: s.noscroll?'inherit':null }} >
            {vs.map((v,i) =>
                    <li key={v}>
                        {p.disabled ? null : <span className="actions">
                            <span className="fa fa-angle-up" onClick={() => {
                                if (i > 0) {
                                    vs = vs.slice();
                                    var t = vs[i - 1];
                                    vs[i - 1] = vs[i ];
                                    vs[i] = t;
                                    p.onChange(vs);
                                }
                            } }></span>
                            <span className="fa fa-angle-down" onClick={() => {
                                if (i<vs.length-1) {
                                    vs = vs.slice();
                                    var t = vs[i + 1];
                                    vs[i + 1] = vs[i];
                                    vs[i] = t;
                                    p.onChange(vs);
                                }
                            } }></span>
                            <span className="fa fa-remove" onClick={() => {
                                vs = vs.slice();
                                vs.splice(i, 1);
                                p.onChange(vs);
                            } }></span></span>
                            } <a href="javascript:;" onClick={(e)=>{e.preventDefault(); this.showEntity(v);}}>{s.texts[i]}</a>
                </li>
            ) }
            {!(p.value && p.value.length) && !p.disabled && p.placeholder ? <li key="empty" className="placeholder">{p.placeholder}</li> : null}
            </ul>
            {p.disabled || !s.selectController ? null : <div>
                <div className="pull-right"><button type="button" className="btn btn-default" onClick={() => this.setState({ noscroll: !s.noscroll }) } > <span className={`fa fa-angle-${s.noscroll ? 'up' : 'down'}`}></span></button></div>
                <div className="btn-group btn-group-sm">
                    <button disabled={(this.props.maxLength || 1000000)<=vs.length} onClick={() => this.showModal() } className="btn btn-default" type="button"><span className="fa fa-plus"></span></button>
                    <button onClick={() => this.clear() } className="btn btn-default" type="button"><span className="fa fa-eraser"></span></button>
                </div>
                <div className="limitation"> {"共"+vs.length + "项"+(this.props.maxLength ? "/最多" + this.props.maxLength +"项": "") }</div>
               
            </div>
            }
        </div>;
    }
}
 //{
 //                   s.modalVisible && s.selectController ? <EntityDialog
 //                       controller={s.selectController}
 //                       action={s.selectAction}
 //                       entityIdent={this.props.value || null}
 //                       title={`选择${p.targetName}`}
 //                       onChange={id => this.handleModalSelected(id) }
 //                       onClose={() => this.showModal(false) }
 //                       /> : null
 //               }


interface state {
    items?: any[];
    name?: string;
    loaded?: boolean;
}

export class EntityPicker extends React.Component<EntityPickerProps, {}>{
    constructor(props: any) {
        super(props);
        //console.log(`${(props as any).label}初始化 S:${props.scopeId} V:${props.value}`);
        //this.state = {};
    }
    render() {
        var p = this.props;
        if (!p.entity) {
            return p.mutiple ?
                <LargeMultipleEntityPicker {...p}/>
                :
                <LargeSingleEntityPicker {...p}/>
                ;
        }

        var lib = ApiMeta.defaultLibrary();
        var c = lib.getEntityController(this.props.entity);
        if (lib.isSimpleEntity(this.props.entity)) {
            return p.mutiple ?
                <SmallMultipleEntityPicker {...p}/>
                :
                <SmallSingleEntityPicker {...p}/>
        }
        else {
            return p.mutiple ?
                <LargeMultipleEntityPicker {...p}/>
                :
                <LargeSingleEntityPicker {...p}/>
        }
    }
    //}



    //load(scopeId:any,value:any) {
    //    var lib = ApiMeta.defaultLibrary();
    //    var c = lib.getEntityController(this.props.entity);
    //    if (lib.isSimpleEntity(this.props.entity)) {
    //        if (scopeId === null)
    //            return;
    //        var act = lib.action(c.Name, "List");
    //        var args = {};
    //        if (act.Parameters && act.Parameters.length)
    //            args[act.Parameters[0].Name] = scopeId;
    //        lib.call(c.Name, "List", args, null).then((re: any) => {
    //            this.setState({ loaded:true, items: prepareTreeOptions(c.Name, re), });
    //        });
    //    }
    //    else if (value) {
    //        var act = lib.AnyAction(c, "get", "getasync");
    //        apicall.call(c.Name, act.Name, { [act.Parameters[0].Name]: value }, null, null).then((re: any) => {
    //            this.setState({ loaded: true, name:re? re.Name || re.Title:"找不到指定对象" });
    //        });
    //    }
    //} 
    //componentDidMount() {
    //    this.load(this.props.scopeId, this.props.value || this.props.initialValue);
    //}
    //componentWillReceiveProps(nextProps: EntityPickerProps, nextContext: any): void {
    //    //if (nextProps.scopeId != this.props.scopeId || nextProps.value != this.props.value) {
    //    //    console.log(`${(this.props as any).label} 属性改变，OS:${this.props.scopeId} NS:${nextProps.scopeId} OV:${this.props.value} NV:${nextProps.value}`);
    //    //}
    //    if (nextProps.scopeId != this.props.scopeId) {
    //        this.setState({ loaded: false });
    //        if (this.props.value)
    //            this.props.onChange("");
    //        this.load(nextProps.scopeId, this.props.value || this.props.initialValue);
    //    }

    //}
    //handleClick() {

    //}
    //render() {
    //    var props = assign(this.props, {} as any);
    //    var disabled = props.disabled;
    //    delete props.className;
    //    delete props.disabled;
    //    if (this.props.scopeId === null)
    //        disabled = true;
    //    var s = this.state;
    //    if (!s.loaded)
    //        return <div className={`form-control entity-picker ${this.props.className || ''}`}>{this.props.scopeId === null ? "请先选择" + this.props.scopeName : "载入中..."}</div>;
    //    var onChange = props.onChange;
    //    delete props.onChange;
    //    var value = props.value || "";
    //    delete props.value;

    //    if (s.items) {
    //        return <select
    //            value={value}
    //            disabled={disabled}
    //            className={`form-control entity-picker ${this.props.className || ''}`}
    //            onChange={onChange
    //                //(e) => {
    //                //console.log(`${(this.props as any).label}内select发出change事件，CV:${this.props.value}, NV:${(e.target as any).value}`);
    //                //onChange(e);
    //                //}
    //            }
    //            {...props}>
    //            {this.props.optional && <option key='-1' value=""> { this.props.scopeId === null ? "请先选择" + this.props.scopeName : this.props.placeholder || null }</option> || null}
    //            {this.state.items.map(it => <option key={it.value} value={it.value}>{it.text}</option>)}
    //        </select>;
    //    }
    //    else {
    //        return <div className={`form-control entity-picker ${this.props.className || ''}`} onClick={() => this.handleClick() }>
    //            {!this.props.value || this.state && this.state.name ? <span className="angle-right"></span> : null}
    //            {this.props.value ? this.state && this.state.name || '载入中...' : this.props.placeholder || null}
    //        </div>;
    //    }
    //}
}