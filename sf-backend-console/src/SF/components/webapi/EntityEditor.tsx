﻿import * as React from 'react'
import {ApiFormManager,defaultFormManager} from './ApiFormManager';
import * as  apicall  from "../../utils/apicall";
import * as  wait  from "../../utils/wait";
import  assign  from "../../utils/assign";
import {ApiForm} from "./ApiForm";
import {createBrowserHistory} from 'history';
var browserHistory=createBrowserHistory();
//import {DynamicFormProps} from '../forms/DynamicForm';
import * as Editors from "../editors";
import { bool } from 'prop-types';
import {Dropdown} from "../utils/Dropdown";

export interface EntityEditorProps {
    id?: string|number | any[];
    help?: string;
    controller: string;
    serviceId?: number;
    className?: string;
    createAction?: string;
    updateAction?: string;
    readonly?: boolean;
    noReturn?:boolean;
    loadAction?: string;
    hideSubmitPanel?: boolean;
    disableCreate?:boolean;
    disableRemove?:boolean;
    onBuildSubmitPanel?: (props: Editors.IBaseEditorProps, state: Editors.IFormState, children?: React.ReactNode) => JSX.Element;
    onSubmitSuccess?(result:any): void;
}
interface state {
    value?: any;

}
export class EntityEditor extends React.Component<EntityEditorProps, state>{
    constructor(props: EntityEditorProps) {
        super(props);
        if (props.id instanceof Array && !props.readonly)
            throw "多主键对象不支持编辑"; 
        this.state = {
            value: props.id ? null : this.getEmptyEntity()
        };
    }
    getLibraryAndLoadAction() {
        var lib = defaultFormManager().library();
        if (this.props.loadAction === null)
            return { lib, act: null };
        var act = lib.action(this.props.controller, this.props.loadAction || "LoadForEdit");
        if(!act)
            act = lib.action(this.props.controller, "Get");
        if (!act)
            throw "实体编辑器找不到动作:" + this.props.controller + "/" + this.props.loadAction;
        return { lib, act };
    }
    getEmptyEntity() {
        var re = {};
        var {lib, act} = this.getLibraryAndLoadAction();
        if(act)
            lib.restoreDefaultValues(re, lib.type(act.Type));
        return re;
    }
    loadValue(id: any) {
        var {lib, act} = this.getLibraryAndLoadAction();
        if (!act)
            return Promise.resolve(this.getEmptyEntity());
        var args: any;
        if (act.Parameters) {
            if ((id instanceof Array) && id.length == 1)
                id = id[0];
            if (id instanceof Array) {
                args = {};
                if (act.Parameters.length == id.length) {
                    act.Parameters.forEach((p, i) => {
                        args[p.Name] = id[i];
                    });
                }
                else if (act.Parameters.length == 1) {
                    var p0type = lib.type(act.Parameters[0].Type);
                    var props = lib.allTypeProperties(p0type);
                    props.forEach((p, i) => {
                        args[p.Name] = id[i];
                    });
                }
            }
            else if (typeof (id) == "object") {
                args = id;
            }
            else{
                
                var p0type = lib.type(act.Parameters[0].Type);
                var props = lib.allTypeProperties(p0type);
                if (props.length == 0)
                    args = { [act.Parameters[0].Name] : id };
                else
                    args= { [props[0].Name]: id};
            }
        }
        return lib.call(
            this.props.controller,
            act.Name,
            args,
            { serviceId: this.props.serviceId }
        ).then(re => {
            if(re)
                lib.restoreDefaultValues(re, lib.type(act.Type), true);
            return re;
        });
    }
    componentDidMount() {
        if (this.props.id)
            wait.start(() =>
                this.loadValue(this.props.id).then(re => {
                    this.setState({
                        value: re,
                    });
                    return re;
                }
                ));
    }
    doSubmit(): PromiseLike<any> {
        return (this.refs["form"] as any).submit();
    }
    handleSubmit() {
        this.doSubmit();
    }
    handleSubmitAndReturn() {
        this.doSubmit().then(re => {
            browserHistory.goBack();
        });
    }
    handleSubmitAndNew() {
        this.doSubmit().then(re => {
            this.setState({ value: this.getEmptyEntity() });
        });
    }
    handleSubmitAndCopy() {
        this.doSubmit().then(re => {
            delete re.Id;
            delete re.id;
            this.setState({  value: re });
        });
    }  
    handleReset() {
        if (!confirm("重置表单将放弃已修改的数据，您要继续么？"))
            return;
        (this.refs["form"] as any).reset();
    }
    handleNew(dirty: boolean) {
        if (dirty && !confirm("表单未保存，新建将放弃已修改的数据，您要继续么？"))
            return;
        this.setState({  value: this.getEmptyEntity() });
    }
    handleRemove(dirty: boolean) {
        if (!confirm("您要删除此对象么？ 删除操作无法撤销！\n为确保数据安全，禁止删除有关联数据的对象！"))
            return;
        (wait.start as any)(
            () =>
                defaultFormManager().library().call(
                    this.props.controller,
                    "Remove",
                    { EntityId: this.state.value.Id }
                    , null)
        ).then(re => {
            browserHistory.goBack();
            }, e => {
                alert(e && e._error || "删除失败，请稍后再试！");
            });
    }
    handleReturn(dirty: boolean) {
        if (dirty && !confirm("表单未保存，您要退出编辑么？"))
            return;
        browserHistory.goBack();
    }
    handleCopy(dirty: boolean) {
        if (dirty && !confirm("表单未保存，您要复制未编辑的对象么？"))
            return;
        var iv = assign(this.state.value, {} as any);
        delete iv.Id;

        this.setState({value:iv});
    }
    setStatePromise(v: any) {
        return new Promise<any>((resolve) => {
            this.setState({ value: v }, () => resolve(v));
        });
    }
    handleOnSubmit(data: any) {
        var {lib, act} = this.getLibraryAndLoadAction();
        if (this.props.readonly) Promise.reject({ _error: "此表单不能修改" });
        return (this.refs["form"] as any).apiCall(data)
            .then(re =>
                this.loadValue(re || act && lib.tryGetIdent(this.state.value, act.Type) || this.state.value.Id)
            )
            .then(re => this.setStatePromise(re));
    }
    getFormProps(): Editors.IBaseEditorProps {
        var f = this.refs["form"] as any;
        return f?f.getFormProps():null;
    }
    getFormState(): Editors.IFormState {
        var f = this.refs["form"] as any;
        return f?f.getFormState():null;
    }
    buildSubmitPanel() {
        var { lib, act } = this.getLibraryAndLoadAction();
        var id = this.state.value && act ? lib.tryGetIdent(this.state.value, act.Type) || this.state.value.Id : this.props.id;
        if ((id instanceof Array) && !id[0]) id = null;

        var createAction = this.props.disableCreate?null: lib.action(this.props.controller, this.props.createAction || "Create");
        var removeAction = this.props.disableRemove?null:lib.action(this.props.controller, "Remove");

        var createSupported = !!createAction;
        var removeSupported = !!removeAction;
        var form = this.refs["form"] as any;

        return this.buildSubmitPanelInternal(
            form.getFormProps(),
            form.getFormState(),
            id,
            createSupported,
            removeSupported
        );
    }
    buildSubmitPanelInternal(
        props: Editors.IBaseEditorProps,
        state: Editors.IFormState,
        id: any,
        createSupported: boolean,
        removeSupported: boolean
    ) {
        if (!props || !state) return null;
        
        return <div className='editor-submit-panel'>
            {this.props.readonly ? null : 
            <div className="btn-group btn-group-sm search">
                <button type='button' className="btn btn-primary" title="保存" disabled={state.submitting || !state.meta.changed} onClick={() => this.handleSubmit()} ><span className={state.submitting ? "fa fa-cog fa-spin" : "fa fa-save"}></span> 保存</button>
                <Dropdown  className="btn btn-primary" style={{paddingBottom:"5px"}} options={
                    [
                        {
                            content: "保存并返回",
                            disabled:state.submitting || !state.meta.changed,
                            onClick: () => this.handleSubmitAndReturn()
                        },
                        {
                            content: "保存并新建",
                            disabled:state.submitting || !state.meta.changed,
                            onClick: () =>  this.handleSubmitAndReturn()
                        },
                        {
                            content: "保存并复制",
                            disabled:state.submitting || !state.meta.changed,
                            onClick: () =>  this.handleSubmitAndCopy()
                        }
                    ]
                }/>
            </div>
            }

            &nbsp;
            {this.props.readonly ? null :
                <div className="btn-group">
                    <button type='button' className="btn btn-default btn-sm" disabled={state.submitting} onClick={() => this.handleReset()} >重置</button>
                    {createSupported && id ? <button type='button' className="btn btn-default btn-sm" disabled={state.submitting} onClick={() => this.handleNew(state.meta.changed)} >新建</button> : null}
                    {createSupported && id ? <button type='button' className="btn btn-default btn-sm" disabled={state.submitting} onClick={() => this.handleCopy(state.meta.changed)} >复制</button> : null}
                    {removeSupported && id ? <button type='button' className="btn btn-default btn-sm" disabled={state.submitting} onClick={() => this.handleRemove(state.meta.changed)} >删除</button> : null}
                    <button type='button' className="btn btn-default btn-sm" disabled={state.submitting} onClick={() => this.handleReturn(state.meta.changed)} >返回</button>
                </div>
            }
            {this.props.readonly && !this.props.noReturn ? <button type='button' className="btn btn-default btn-sm" disabled={state.submitting} onClick={() => this.handleReturn(state.meta.changed)} >返回</button> : null}
        </div>;
    }
    render() {
        var {lib, act} = this.getLibraryAndLoadAction();
        var id = this.state.value && act ? lib.tryGetIdent(this.state.value, act.Type) || this.state.value.Id : this.props.id;
        if ((id instanceof Array) && !id[0]) id = null;

        var updateAction = lib.action(this.props.controller, this.props.updateAction || "Update");
        var createAction = this.props.disableCreate?null:lib.action(this.props.controller, this.props.createAction || "Create");
        var removeAction = this.props.disableRemove?null:lib.action(this.props.controller, "Remove");

        var createSupported = !!createAction;
        var removeSupported = !!removeAction;

        var curAction = id ? updateAction : createAction;
        var help = this.props.help || curAction && curAction.Description;
        return <div className={`entity-editor ${this.props.className || ''}`}>

            {!this.state.value ? null : <ApiForm
                //key={this.state.formKey}
                ref="form"
                help={help}
                readonly={this.props.readonly}
                controller={this.props.controller}
                serviceId={this.props.serviceId}
                action={this.props.readonly || !curAction ? "@" + act.Name : curAction.Name }
                value={this.state.value}
                onChange={(v) => {
                    console.log(v) 
                    this.setState({ value: v });
                }
                }
                editMode={!!id}
                onSubmit={(data) => this.handleOnSubmit(data) }
                onSubmitSuccess={this.props.onSubmitSuccess}
                hideSubmitPanel={this.props.hideSubmitPanel}
                onBuildSubmitPanel={(props: Editors.IBaseEditorProps, state: Editors.IFormState) => {
                    var cmds = this.buildSubmitPanelInternal(props, state, id, createSupported, removeSupported);
                    return this.props.onBuildSubmitPanel ? this.props.onBuildSubmitPanel(props, state, cmds as any) :<div style={{paddingTop:"10px"}}>{cmds}</div>;
                } }
                />
            }
        </div>

    }
}