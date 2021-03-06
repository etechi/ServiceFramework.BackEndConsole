﻿import * as React from 'react'
import Debouncer from "../../utils/Debouncer";
import  assign  from "../../utils/assign"; 

export type MetaDataChildren = { [index: string]: MetaData } | MetaData[];
export class MetaData {
    changed: boolean;
    error: string;
    hasError: boolean; 

    _isCurChanged: boolean;
    _isChildChanged: boolean;
    _hasChildError: boolean;  
    _children: MetaDataChildren; 
 
    constructor(
        error?: string,
        isCurChanged?: boolean,
        isChildChanged?: boolean,
        hasChildError?: boolean,
        children?: { [index: string]: MetaData } | MetaData[]
    ) {
        this._isCurChanged = isCurChanged || false;
        this._isChildChanged = isChildChanged || false;
        this.changed = isCurChanged || isChildChanged || false;

        this.error = error || null;
        this.hasError = error != null || hasChildError || false;
        this._hasChildError = hasChildError || false;

        this._children = children || null;
    }
    equal(m: MetaData) {
        return this.changed == m.changed &&
            this.error == m.error &&
            this.hasError == m.hasError &&
            this._isCurChanged == m._isCurChanged &&
            this._isChildChanged == m._isChildChanged &&
            this._hasChildError == m._hasChildError &&
            this._children == m._children;
    }
    child(key: string | number): MetaData {
        return this._children && this._children[key] || null;
    }
    with(args: {
        error?: string;
        isCurChanged?: boolean;
        isChildChanged?: boolean;
        hasChildError?: boolean;
        children?: MetaDataChildren
    }) {
        return new MetaData(
            args.error || this.error,
            args.isCurChanged || this._isCurChanged,
            args.isChildChanged || this._isChildChanged,
            args.hasChildError || this._hasChildError,
            args.children || this._children
        );
    }

    static updateObjectChild(meta: MetaData, key: string, child: MetaData): MetaData {
        if (!meta)
            return new MetaData(
                null,
                false,
                child.changed,
                child.hasError,
                { [key]: child }
            );

        var isChildChanged = meta._isChildChanged;
        var hasChildError = meta._hasChildError;
        if (child.changed)
            isChildChanged = true;
        if (child.hasError)
            hasChildError = true;

        var cs: { [index: string]: MetaData } = null;
        var ocs = meta._children as {[index: string]: MetaData};
        if (ocs) {
            var om = ocs[key];
            if (om) {
                if (child.equal(om))
                    return meta;
                cs = assign(ocs, { [key]: child });

                if (meta._isChildChanged && !child.changed && om.changed) {
                    isChildChanged = false;
                    for (var k in cs)
                        if (cs[k].changed) {
                            isChildChanged = true;
                            break;
                        }
                }
                if (meta._hasChildError && !child.hasError && om.hasError) {
                    hasChildError = false;
                    for (var k in cs)
                        if (cs[k].hasError) {
                            hasChildError = true;
                            break;
                        }
                }
            }
            else 
                cs = assign(ocs, { [key]: child });
        }
        else
            cs = { [key]: child };

        return new MetaData(
            meta.error,
            meta._isCurChanged,
            isChildChanged,
            hasChildError,
            cs
            );
    }
    static updateArrayChild(meta: MetaData, idx: number, child: MetaData) {
        if (!meta) {
            var chds = [];
            chds[idx] = child;
            return new MetaData(
                null,
                false,
                child.changed,
                child.hasError,
                chds
            );
        }

        var isChildChanged = meta._isChildChanged;
        var hasChildError = meta._hasChildError;
        if (child.changed)
            isChildChanged = true;
        if (child.hasError)
            hasChildError = true;

        var cs: MetaData[] = null;
        var ocs = meta._children as MetaData[];
        if (ocs) {
            if (idx < 0) // || idx >= ocs.length 不检查下标上限，新建项目后，meta数组不会增加项目
                throw "索引溢出";
            var om = meta._children[idx];
            if (om) {
                if (child.equal(om))
                    return meta;
                cs = ocs.slice();
                cs[idx] = child;

                if (meta._isChildChanged && !child.changed && om.isChanged) {
                    isChildChanged = false;
                    for (var i = 0, l = cs.length; i < l; i++) {
                        var m = cs[i];
                        if (m && m.changed) {
                            isChildChanged = true;
                            break;
                        }
                    }
                }
                if (meta._hasChildError && !child.hasError && om.hasError) {
                    hasChildError = false;
                    for (var i = 0, l = cs.length; i < l; i++) {
                        var m = cs[i];
                        if (m && m.hasError) {
                            hasChildError = true;
                            break;
                        }
                    }
                }
            }
            else {
                cs = ocs.slice();
                cs[idx] = child;
            }
        }
        else {
            cs = [];
            cs[idx] = child;
        }

        return new MetaData(
            meta.error,
            meta._isCurChanged,
            isChildChanged,
            hasChildError,
            cs
        );
    }
}

export class ChangeEvent {
    value: any;
    meta: MetaData;
    constructor(value: any, meta: MetaData) {
        this.value = value;
        this.meta = meta;
    }
    newObjectUpperEvent(key: string, value:any, meta: MetaData) {
        var nv = assign(value || {}, { [key]: this.value });
        var nm = MetaData.updateObjectChild(meta,key, this.meta);
        return new ChangeEvent(nv, nm);
    }
    newArrayUpperEvent(index: number, value: any, meta: MetaData) {
        var nv = value ? value.slice() : [];
        nv[index] = this.value;
        var nm = MetaData.updateArrayChild(meta,index, this.meta);
        return new ChangeEvent(nv, nm);
    }
    static newArrayMoveEvent(value:any[],meta:MetaData,index: number, length: number, insert: number) {
        var len = value && value.length || 0;
        if (index < 0 || index + length > len || !length)
            throw "索引超出数组边界"
        if (insert < 0 || insert >= index && insert <= index + length)
            throw "移动参数不合法";

        var update = (arr: any[]) => {
            var d = arr.splice(index, length);
            if (insert < index)
                arr.splice.apply(arr, [insert, 0].concat(d));
            else
                arr.splice.apply(arr, [insert - length, 0].concat(d));
        }
        var newValue = value.slice();
        var newMetaChild = meta && meta._children && (meta._children as MetaData[]).slice() || null;
        update(newValue);
        if (newMetaChild) update(newMetaChild);
        return new ChangeEvent(
            newValue,
            new MetaData(
                meta && meta.error || null,
                true,
                meta && meta._isChildChanged || false,
                meta && meta._hasChildError || false,
                newMetaChild
            )
        );
    }

    static newArraySpliceEvent(value: any[], meta: MetaData,index: number, deleteCount: number, inserts: any[]) {
        var len = value && value.length || 0;
        if (index < 0 || index > len)
            throw "索引超出数组边界";

        var newValue = value ? value.slice() : [];
        var metaChildren = meta && meta._children && (meta._children as MetaData[]).slice() || null;

        var insertLength = inserts && inserts.length || 0;
        if (insertLength) {
            newValue.splice.apply(newValue, [index, deleteCount].concat(inserts));
        }
        else {
            newValue.splice(index, deleteCount);
        }
        var hasChildError = false;
        var isChildChanged = false;
        if (deleteCount && metaChildren) {
            metaChildren.splice(index, deleteCount);
            for (var i = 0, l = metaChildren.length; i < l; i++) {
                var m = metaChildren[i];
                if (m) {
                    if (!hasChildError && m.hasError) {
                        hasChildError = true;
                        if (isChildChanged)
                            break;
                    }
                    if (!isChildChanged && m.changed) {
                        isChildChanged = true;
                        if (hasChildError)
                            break;
                    }
                }
            }
        }
        else {
            isChildChanged = meta && meta._isChildChanged || false;
            hasChildError = meta && meta._hasChildError|| false;
        }
        return new ChangeEvent(
            newValue,
            new MetaData(
                meta && meta.error || null,
                true,
                isChildChanged,
                hasChildError,
                metaChildren
            )
        );
        
    }
}
export interface IInputProps {
    value: any;
    disabled?: boolean;
    placeholder?: string;
    onChange(e: ChangeEvent | React.FormEvent<Element> | any);
}

export interface IBaseEditorProps extends IInputProps {
    meta?: MetaData;
    validator?(value: any): string;
    normalizer?(value: any,prevValue:any): any;
    parser?(value: any): any;
    formater?(value: any): any;
    
}
export interface IEditorProps extends IBaseEditorProps{
    errorUpdate?(set:any,key:string,error:string):any;
    child(props: IBaseEditorProps): JSX.Element;
}


function equal(l: any, r: any) {
    if (l == r) return true;
    if (!l != !r) return false;

    var lt = Array.isArray(l)?"array": typeof l;
    var rt = Array.isArray(r)?"array" :typeof r;
    if (lt != rt)
        return false;
    
    switch (lt) {
        case 'array':
            {
                var ll = l.length;
                var rl = r.length;
                if (ll != rl) return false;
                for (var i = 0; i < ll; i++)
                    if (!equal(l[i], r[i]))
                        return false;
                return true;
            }
        case 'object':
            {
                for (var k in l) {
                    if (!(r as Object).hasOwnProperty(k))
                        return false;
                    if (!equal(l[k], r[k]))
                        return false;
                }
                for (var k in r)
                    if (!(l as Object).hasOwnProperty(k))
                        return false;
                return true;
            }
        default:
            return false;
    }
}


export class Editor extends React.Component<IEditorProps, { version?: number }>{
    handleChange(e: ChangeEvent | React.FormEvent<Element> | any ) {
        var v;
        var meta: MetaData = null;
        if (e instanceof ChangeEvent) {
            v = e.value;
            meta = (e as ChangeEvent).meta;
        }
        else if (e && e.target && e.preventDefault && e.stopPropagation) {
            v = e.target.value;
        }
        else
            v = e;

        var {parser, normalizer, onChange, value, validator,errorUpdate} = this.props;
        if (parser)
            v = parser(v);
        if (normalizer)
            v = normalizer(v, value);
        this.setState({
            version: (this.state && this.state.version || 0) + 1
        });
        if (v == value)
            return;

        var ve = validator && validator(v) || null;
        var ce = new ChangeEvent(
            v,
            new MetaData(
                ve,
                true,
                meta && meta._isChildChanged || false,
                meta && meta._hasChildError || false,
                meta && meta._children || null
            )
        );
        this.props.onChange(ce);
    }
    render() {
        var ps = this.props;
        var cps = assign(ps, {
            onChange: (e) => this.handleChange(e),
            value: ps.formater ? ps.formater(ps.value) : ps.value
        });
        return this.props.child(cps);
    }
}

export interface IObjectField {
    key:string,
}

export interface IFieldEditorProps extends IBaseEditorProps {
    field: IObjectField
}

export interface IObjectEditorProps extends IBaseEditorProps {
    fields: IObjectField[];
    child(items: { [index: string]: IFieldEditorProps }, props: IObjectEditorProps): JSX.Element;
}
function setUpdate(set: Object, key: string, value: any) {
    if (value) {
        var nset:any = {};
        if (set)
            for (var k in set)
                nset[k] = set[k];

        nset[key] = value;
        return nset;
    }
    else if (!set)
        return null;
    else {
        if (!set.hasOwnProperty(key))
            return set;
        var nset:any = null;
        for (var k in set) 
            if (k != key) {
                if (!nset) nset = {};
                nset[k] = set[k];
            }
        return nset;
    }
}
export class ObjectEditor extends React.Component<IObjectEditorProps, {}>{
    render() {
        var ps = assign(this.props, {}) as any;
        ps.child = (ps: IEditorProps) => {
            var {child, fields, value, disabled, meta} = this.props;
            var items: { [index: string]: IFieldEditorProps } = {};
            fields.forEach(f => {
                items[f.key] = {
                    meta: meta && meta.child(f.key) || null,
                    value: value && value[f.key],
                    onChange: (e: ChangeEvent) => 
                        ps.onChange(e.newObjectUpperEvent(f.key, value, meta)),
                    field:f
                };
                if (disabled)
                    items[f.key].disabled = true;
            });
            return child(items, this.props);
        };
        ps.errorUpdate=setUpdate;
        return <Editor {...ps}/>;       
    }
}

export interface IArrayEditorProps extends IBaseEditorProps {
    child(items: IInputProps[], array: IDataArray, props: IArrayEditorProps): JSX.Element;
}

export interface IDataArray{
    length(): number;
    move(index: number, length: number, insert: number): boolean;
    splice(index: number, deleteCount: number,...inserts:any[]): boolean;
}
function arrayIsEmpty(arr: any[]) {
    for (var i = 0, l = arr.length; i < l; i++)
        if (arr[i])
            return false;
    return true;
}
function arrayUpdate(arr: any[], key: any, value: any) {
    if (value) {
        arr = arr ? arr.slice() : [];
        arr[key] = value;
        return arr;
    }
    else if (!arr)
        return null;
    else {
        if (!arr[key])
            return arr;
        arr = arr.slice();
        if ('number' == typeof key)
            arr[key] = null;
        else
            delete arr[key];
        if (arr["_error"]) return arr;
        for (var i = 0, l = arr.length; i < l; i++)
            if (arr[i])
                return arr;
        return null;
    }
}
export class ArrayEditor extends React.Component<IArrayEditorProps, {}> implements IDataArray {
    _handleChange: (e: ChangeEvent) => void;
    render() {
        var ps = assign(this.props, {}) as any;
        ps.child = (cps:IBaseEditorProps) => {
            this._handleChange = cps.onChange;
            var {child, value, disabled,meta} = this.props;
            var chds = value && value.map((v, idx) => {
                var re:any = {
                    meta: meta && meta.child(idx) || null,
                    value: v,
                    onChange: (e: ChangeEvent) =>
                        cps.onChange(e.newArrayUpperEvent(idx, value, meta))
                };
                if (disabled)
                    re.disabled = true;
                return re;
            }) || [];
            return child(chds, this, this.props);
        };
        ps.errorUpdate=arrayUpdate;
        return <Editor {...ps}/>
    }
    componentWillUnmount() {
        this._handleChange = null;
    }
    notifyChange(e: ChangeEvent) {
        if (!this._handleChange) return;
        this._handleChange(e);
    }
    length() {
        return this.props.value && this.props.value.length || 0;
    }
    move(index: number, length: number, insert: number) {
        var {value, meta, onChange} = this.props;
        var e = ChangeEvent.newArrayMoveEvent(value, meta, index, length, insert);
        this.notifyChange(e);
        return true;
    }
    splice(index: number, deleteCount: number, ...inserts: any[]) {
        var {value, meta,onChange, validator} = this.props;
        var e = ChangeEvent.newArraySpliceEvent(value, meta, index, deleteCount, inserts);
        this.notifyChange(e);
        return true;
    }

}
function metaMerge(om: MetaData, nm: MetaData) {
    if (!om || !nm)
        return om || nm || undefined;

    var ocs:any = om._children;
    var ncs: any = nm._children;
    var cs: any = null;
    var hasChildError = false;
    if (ocs && ncs) {
        if (ocs instanceof Array) {
            cs = [];
            for (var i = 0, l = Math.max(ocs.length, ncs.length); i < l; i++) {
                var oci = ocs[i];
                var nci = ncs[i];
                var ci = metaMerge(oci, nci);
                if (ci) {
                    cs[i] = ci;
                    if (ci.hasError && !hasChildError)
                        hasChildError = true;
                }
            }
        }
        else {
            cs = {};
            for (var k in ocs) {
                var oci = ocs[k];
                var nci = ncs[k];
                var ci = metaMerge(oci, nci);
                cs[k]=ci;
                if (ci.hasError && !hasChildError)
                    hasChildError = true;
            }
            for (var k in ncs)
                if (!ocs.hasOwnProperty(k)) {
                    var ci = ncs[k] as MetaData;
                    cs[k] = ci;
                    if (ci.hasError && !hasChildError)
                        hasChildError = true;
                }
        }
    }
    else
        cs = ncs || ocs || null;
    return new MetaData(
        nm.error || om.error,
        om._isCurChanged,
        hasChildError,
        nm._hasChildError,
        cs
    );
}

export interface IFormProps {
    help?: string;
    value: any;
    onSubmit(value): PromiseLike<any>;
    render(prop: IBaseEditorProps, state: IFormState): JSX.Element | JSX.Element[];
    disabled?: boolean;
    onChange(value): void;
    className?: string;
    validateAll(value): MetaData;
    autoSubmitTimeout?: number;
}
export interface IFormState {
    submitting?: boolean;
    curValue?: any;
    submitError?: any;
    error?: any;
    meta?: MetaData,
    validatedAll?: boolean,
    submitChanging?: number;
    submitChanged?: number;
}
function mergeError(meta: MetaData, submitError: string) {
    return [meta && meta.error || null, submitError || null].filter(s => !!s).join(' ');
}
export class Form extends React.Component<IFormProps, IFormState>{
    constructor(props: IFormProps) {
        super(props);
        this.state = {
            curValue: props.value,
            meta: new MetaData(),
            error: null,
            submitError: null,
            submitting: false,
            validatedAll: false,
            submitChanging: 0,
            submitChanged:0
        };
    }
    componentWillUnmount(): void {
        if (this.autoFilterTimer)
            clearTimeout(this.autoFilterTimer);
    }

    componentWillReceiveProps(nextProps: IFormProps, nextContext: any): void {

        this.setState({
            curValue: this.state.submitChanged == this.state.submitChanging && equal(nextProps.value, this.props.value) ?
                this.state.curValue : nextProps.value,
            submitChanged: this.state.submitChanging,
            meta: new MetaData(),
            submitError:null,
            error: null,
            validatedAll:false
        });
    }

    autoFilterTimer: any = null;
    handleChange(e: ChangeEvent) {
        this.setState({
            curValue: e.value,
            meta: e.meta || new MetaData(),
            error: mergeError(e.meta,this.state.submitError)
        });

        if (this.props.autoSubmitTimeout) {
            if (this.autoFilterTimer)
                clearTimeout(this.autoFilterTimer);
            this.autoFilterTimer = setTimeout(() => {
                this.autoFilterTimer = null;
                this.submit();
            }, this.props.autoSubmitTimeout);
        }
    }
    reset(){
        this.setState({
            curValue: this.props.value,
            meta: new MetaData(),
            submitError: null,
            error: null,
            validatedAll: false
        });
    }
    submit() {
        const {curValue, meta, submitting, validatedAll} = this.state;
        const {onSubmit, onChange, validateAll} = this.props;
         
        var newMeta = metaMerge(meta, validateAll(curValue));
        if (newMeta.hasError) {
            this.setState({
                meta: newMeta,
                error: mergeError(newMeta,this.state.submitError)
            });
            return Promise.reject({ _error: "表单有错误，不能提交" });
        }
        if(submitting)
            return Promise.reject({_error:"正在请求"});
        this.setState({
            submitting: true,
            submitError: null,
            error: this.state.meta.error || null
        })
        var re=onSubmit(curValue).then(
            (v) => {
                this.setState({
                    submitting: false,
                    submitError: null,
                    error: null,
                    validatedAll: false,
                    meta: new MetaData(),
                    submitChanging: this.state.submitChanging + 1
                }, () =>
                     onChange(v)
                );
                return v;
            });
        re.then(
            ()=>{},
            err => {
                var se = err._error || err;
                this.setState({
                    submitting: false,
                    submitError: se,
                    error: mergeError(this.state.meta,se)
                });
            });
        return re;
    }
    //_submitHandler:Function;
    //componentDidMount(){
    //    this._submitHandler=(e)=>this.handleSubmit(e);
    //    (this.refs["form"] as any).addEventListener("submit",this._submitHandler);
    //}
    //componentWillUnmount(){
    //    if(this._submitHandler)
    //    {
    //        (this.refs["form"] as any).removeEventListener("submit",this._submitHandler);
    //        this._submitHandler=null;
    //    }
    //}
    getFormProps() :IBaseEditorProps{
        const { curValue, meta, submitError } = this.state;
        return {
            meta: meta,
            onChange: (e) => this.handleChange(e),
            disabled: this.props.disabled,
            value: curValue
        };
    }
    getFormState(): IFormState {
        return this.state;
    }
    render() {
        const {help,render,className} = this.props;
        const {curValue, meta, submitError} = this.state;
        return <form className={`dynamic-form ${className || ''}`} onSubmit={e => { e.preventDefault(); this.submit(); } }>
            {help ? <div className="text-info">{help}</div> : null}
            {this.props.render({
                meta: meta,
                onChange: (e) => this.handleChange(e),
                disabled: this.props.disabled,
                value: curValue
            },this.state)}
        </form>
    }

}


