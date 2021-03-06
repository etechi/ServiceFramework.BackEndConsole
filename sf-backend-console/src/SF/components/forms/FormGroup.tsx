﻿import * as React from 'react'
//import {FieldProp} from 'redux-form';
import  assign  from "../../utils/assign";
import * as Editors from "../editors";
 
export interface ValidateState {
    [index: string]: string;
}
export interface ErrorProps {
    text: string
}

export class Error extends React.Component<ErrorProps, {}>{
    render() {
        var error = this.props.text;
        if (!error) return null;
        return <span className='error'>{error}</span>
    }
}


export interface FormGroupProps  {
    name?: string;
    meta: Editors.MetaData;
    className?: string;
    label?: string;
    children?: React.ReactNode;
    controlContentClass?: string;
    iconSuccess?: string;
    iconError?: string;
    help?: string;
    required?: boolean;
    disabled?: boolean;
    preventStateClass?:boolean;
} 
export class FormGroup extends React.Component<FormGroupProps, {}>{
    render() {
        const {
            className,
            name,
            meta,
            label,
            iconSuccess,
            iconError,
            help,
            required,
            disabled,
            preventStateClass
        } = this.props;
        var success = meta && !meta.hasError || false;
        var changed = meta && meta.changed || false;
        var error = meta && meta.error || null;
        return <div className={`form-group clearfix ${className || ''}${changed && !preventStateClass && ' has-feedback' || ''}${changed && success&& !preventStateClass && ' has-success' || ''}${changed && !success&& !preventStateClass && ' has-error' || ''}`}>
            {label && <label className={`control-label ${required ? 'input-required' : ''}`} htmlFor={name} title={help}>{label}</label>}
            <div className={`control-content ${this.props.controlContentClass || ''}${disabled?' readonly':''}`}>{this.props.children}</div>
            {!changed ? null : success ?
                (iconSuccess && <span className= "glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span> || null) :
                (iconError && <span className="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span> ||null)
            }
            {changed && error && <Error text={error}/> || null}
            {help && <span className="form-help">{help}</span> || null}
        </div>
    }
}
