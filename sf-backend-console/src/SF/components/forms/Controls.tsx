﻿import * as React from 'react'
//import {FieldProp} from 'redux-form';
import  assign  from "../../utils/assign";
import Debouncer from "../../utils/Debouncer";
import MultipleLinesText from "../utils/MultipleLinesText";

export interface ControlPropsBase  {
    value:any;
    error?:any;
    onChange(e:any):void;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export interface EditBoxProps extends ControlPropsBase{
    icon?: string;
    placeholder?: string;
    type?: "text" | "password";
    maxLength?: number;
    prefix?: string;
    postfix?: string;
    options?: string[];
    showChars?: boolean;
    rows?: number;
    copyable?: boolean;
    filter?(v: string): string;
}
interface EditBoxState {
    showOptions?: boolean;
    copied?: boolean;
    editValue?: any;
    curValue?: any;
    pwdVisible?:boolean;
}
export class EditBox extends React.Component<EditBoxProps, EditBoxState>{
    constructor(props: EditBoxProps) {
        super(props);
        this.state = {
            curValue: props.value,
            editValue: props.value
        };
    }
    handleShowOptions() {
        setTimeout(() => {
            var h = (e) => {
                document.body.removeEventListener("mouseup", h);
                setTimeout(() => {
                    this.setState({ showOptions: false });
                }, 10);
            }
            document.body.addEventListener("mouseup", h);
        }, 100);
        this.setState({ showOptions: true });
    } 
    _onChanged:boolean=false;
    _debouncer=new Debouncer();
    componentWillReceiveProps(nextProps: EditBoxProps, nextContext: any): void{
        if (nextProps.value != this.state.curValue)
            this.setState({
                curValue: nextProps.value,
                editValue: nextProps.value
            });

        if (nextProps.copyable && this.state && this.state.copied)
            this.setState({ copied: false });

        if(this._onChanged)
        {
            this._onChanged=false;
            this._debouncer.exec(()=>{
                (this.refs["input"] as any).focus();
            },10,"focus");
        }
    }
    _clipboard = null;
    componentDidMount() {
        if (this.props.copyable && window["Clipboard"]) {
            this._clipboard = new window["Clipboard"](this.refs["copy"], {
                text: () => {
                    this.setState({ copied: true });
                    return this.props.value;
                }
            });
        }
    }
    componentWillUnmount() {
        if (this._clipboard)
            this._clipboard.destroy();
        this._debouncer.dispose();
    }
    handleChange(e: any) {
        var v = e.target.value;
        var cv = this.props.filter ? this.props.filter(v) : v;
        if (cv === undefined) {
            this.setState({ editValue: this.state.curValue });
            return;
        }
        this.setState(
            { editValue: v, curValue: cv },
            () => {
                //this._debouncer.exec(() => {
                    if (cv != this.state.curValue)
                        return;
                    this._onChanged = true;
                    this.props.onChange(cv);
                //}, 10, "change");
        });
    }
    render() {
        let input: JSX.Element;
        let {type, className, placeholder, onChange, disabled, maxLength, rows} = this.props;
        let value = this.state.editValue;

        var props = assign(this.props, {}) as any;
        if (value === undefined)
            value = "";
        if (this.props.disabled && this.props.type != "password")
        {
            if (rows && rows > 1)
                input = <MultipleLinesText className='form-control' text={value}/>
            else
                input = <div className='form-control'>{value}</div>
        }
        else if (rows && rows > 1)
            input = <textarea
                ref='input'
                className='form-control'
                onChange={e => this.handleChange(e) }
                {...{ value, placeholder, disabled, maxLength,rows }}
                />
        else
            input = <input
                 ref='input' 
                type={type=='password' && this.state.pwdVisible?'text':type  || 'text'}  
                className='form-control' 
                onChange={e => this.handleChange(e) }
                {...{ value, placeholder, disabled,maxLength}}
                />

        if (this.props.icon || this.props.prefix || this.props.postfix || this.props.options)
            input = <div className="input-group">
                {this.props.icon && <span className="input-group-addon"><span className={this.props.icon}></span></span> || null}
                {this.props.prefix && <span className="input-group-addon">{this.props.prefix}</span> || null}
                {input}
                {this.props.postfix && <span className="input-group-addon">{this.props.postfix}</span> || null}
                {this.props.options &&
                    <span className={`input-group-btn ${this.state && this.state.showOptions && 'open' || ''}`}>
                        <button 
                            type="button"
                            className="btn btn-default"
                            aria-haspopup="true"
                            aria-expanded="false"
                            onClick={() => this.handleShowOptions() }
                        ><span className="caret"></span>
                        </button>
                        <ul style={{ left: 'auto' }} className="dropdown-menu dropdown-menu-right">
                        {this.props.options.map((o, i) =>
                            <li key={i}>
                                <a href="javascript:;" onClick={() =>this.props.onChange(o)}>{o}</a>
                            </li>
                        ) }
                        </ul>
                    </span> ||
                    null}
            </div>;

        if (maxLength && !disabled && !this.props.error && this.props.showChars && this.props.type!="password")
            input = <div className='with-chars'>
                {input}<span>{`${(props.value || "").length}/${props.maxLength}`}</span>
            </div>

        if (disabled && this.props.copyable) {
            input = <div className='with-copy'>
                {input}<button type="button" className="btn btn-default btn-xs" ref="copy"><span className={`fa fa-${this.state && this.state.copied?'check':'copy'}`}></span> 复制</button>
            </div>
        }
        if(this.props.type=="password"){
            input = <div className='with-copy'>
                {input}<button type="button" className="btn btn-default btn-xs" onClick={()=>{
                    this.setState({pwdVisible:!this.state.pwdVisible})
                }} ><span className={`fa fa-eye`}></span></button>
            </div>
        }
        return input;
    }
}

export interface TextAreaProps extends ControlPropsBase {
    placeholder?: string;
    maxLength?: number;
}
export class TextArea extends React.Component<TextAreaProps, { showOptions?: boolean }>{
    render() {
        let input: JSX.Element;
        const {className} = this.props;
        var props = assign(this.props, {}) as any;
        delete props.className;
        if (props.error && props.touched)
            delete props.placeholder;

        return <textarea className={`form-control ${className || ''}`} {...props}/>
    }
}

export interface CheckBoxProps extends ControlPropsBase{
    optional?:boolean;
}
export class CheckBox extends React.Component<CheckBoxProps, {}>{
    render() {
        var props = this.props;
        const {className,optional} = props;
        return <span
            onClick={() => { if (!props.disabled) props.onChange(props.value?false:optional && props.value===false?undefined:true) } }
            className={`check-icon fa ${props.value ? 'fa-check-square-o' :optional && props.value===undefined?'fa-square':'fa-square-o'} ${className||''}`}
            style={optional && props.value===undefined?{color:"#ccc",fontSize:"14px !important"}:{fontSize:"14px !important"}}
            title={props.value?"是":props.value===false?"否":"未选择"}
            ></span>
    }
}
export interface SelectProps extends ControlPropsBase {
    icon?: string;
    value: any;
    placeholder?: string;
    children?: React.ReactNode;
    prefix?: string;
    postfix?: string;
}
export class Select extends React.Component<SelectProps, {}>{
    render() {

        const {className,value,onChange,disabled} = this.props;
        var props = assign(this.props, {}) as any;
        delete props.className;
        
        var isGroup = props.icon || props.prefix || props.postfix;

        var input = <select className={`form-control ${isGroup ? '' : (className || '')}`} {...{value,onChange,disabled}}>{this.props.children}</select>

        if (this.props.icon || this.props.prefix || this.props.postfix)
            input = <div className={`input-group ${className || ''}`}>
                {this.props.icon && <span className="input-group-addon"><span className={this.props.icon}></span></span> || null}
                {this.props.prefix && <span className="input-group-addon">{this.props.prefix}</span> || null}
                {input}
                {this.props.postfix && <span className="input-group-addon">{this.props.postfix}</span> || null}
            </div>;
        return input;
    }
}


export interface ButtonProps {
    disabled?: boolean;
    children?: React.ReactNode;
    className?: string;
    type?: string;
    onClick?(): void;
}

export class Button extends React.Component<ButtonProps, {}>{
    render() {
        const {disabled, children, className, type, } = this.props;
        return <button className={className} type={type || "button"} onClick={this.props.onClick} disabled= {disabled } >{children}</button>;
    }
}
