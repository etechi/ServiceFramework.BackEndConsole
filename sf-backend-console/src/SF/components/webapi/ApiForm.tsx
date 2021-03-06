﻿import * as React from 'react'
import * as ApiFormManager from './ApiFormManager';

import * as  wait  from "../../utils/wait";
//import {DynamicFormProps, resetForm} from "../forms/DynamicForm";
import * as Editors from "../editors";


function formManager() {
    return ApiFormManager.defaultFormManager();
}
 
export interface ApiFormProps {
    args?: any;
    help?: string;
    hertMode?: boolean;
    className?: string;
    controller: string;
    serviceId?: number;
    action: string;
    editMode?: boolean;
    value: any;
    onChange?(value): void;
    hideSubmitPanel?: boolean;
    autoSubmitTimeout?: number;
    onBuildSubmitPanel?(props: Editors.IBaseEditorProps, state: Editors.IFormState) :React.ReactNode;
    onSubmit?(data: any): PromiseLike<any>,
    onSubmitSuccess?(result: any):void;
    readonly?: boolean;
}
 
export class ApiForm extends React.Component<ApiFormProps, {value?:any}>{
    
    submit() {
        return (this.refs["form"] as any).submit();
    } 
    reset() {
        return (this.refs["form"] as any).reset();
    } 
    apiCall(data: any) {
        return wait.start(() =>
            formManager().library().call(
                this.props.controller,
                this.props.action,
                data,
                { serviceId: this.props.serviceId }
            ));
    }
    //componentWillReceiveProps(nextProps: ApiFormProps) {
    //    alert("ApiForm:componentWillReceiveProps:" + this.props.action+":"+ JSON.stringify(nextProps.value));
    //}
    getFormProps(): Editors.IBaseEditorProps {
        var f = this.refs["form"] as any;
        return f ? f.getFormProps() : null;
    }
    getFormState(): Editors.IFormState {
        var f = this.refs["form"] as any;
        return f ? f.getFormState() : null;
    }


    render() {
        var form = formManager().form(
            this.props.controller + "/" + this.props.action,
            {
                className: this.props.className,
                hertMode: this.props.hertMode,
                editMode: this.props.editMode,
                readonly: this.props.readonly
            }
        );
        var args:any = {
            ref: "form",
            autoSubmitTimeout: this.props.autoSubmitTimeout,
            className: this.props.className,
            value: this.state && this.state.value || this.props.value,
            onChange: this.props.onChange || ((v) => this.setState({ value: v })),
            hideSubmitPanel: this.props.hideSubmitPanel,
            onBuildSubmitPanel: this.props.onBuildSubmitPanel,
            errorPosition: "top",
            help: this.props.help,
            onSubmit: (data) => {
                var re = this.props.onSubmit ? this.props.onSubmit(data) : this.apiCall(data);
                if (this.props.onSubmitSuccess)
                    re.then(
                        re =>
                            this.props.onSubmitSuccess(re),
                        err =>
                            err
                    );
                return re;
            }
        };
        return React.createElement(form, args);
    }
}