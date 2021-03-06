﻿import * as React from 'react';
import  assign  from "../../utils/assign";
import * as PropTypes from 'prop-types'
var curModalContainer: ModalContainer;
export interface IModalSource {
    modalRender(): JSX.Element;
}


export interface ModalHeaderProps {
    closable?:boolean
    children?:React.ReactNode;
}
export class ModalHeader extends React.Component<ModalHeaderProps, {onClose:()=>void}> {
    constructor(props:ModalHeaderProps,ctx:any){
        super(props);
        this.state={onClose:ctx.onClose};
    }
    render() {
        var p = this.props;
        return <div className="modal-header">
            {p.closable ?
                <button type="button" onClick={() =>{
                    var s=this.state;
                    if(s.onClose) s.onClose();
                    }}
                    className="bootbox-close-button close"
                    aria-hidden="true"
                    ><span className="fa fa-remove"></span></button> : null
            }
            <h4 className="modal-title">{p.children}</h4>
        </div> ;
    }
}

(ModalHeader as any).contextTypes = {
    onClose: PropTypes.func
};
export class ModalBody extends React.Component<{ children?: React.ReactNode}, {}> {
    render() {
        return <div className="modal-body">
            {this.props.children}
        </div>
    }
}
export class ModalFooter extends React.Component<{ children?: React.ReactNode }, {}> {
    render() {
        return this.props.children ? <div className="modal-footer">
            {this.props.children}
        </div> : null;
    }
}

export interface ModalProps {
    height?: string|number;
    maxHeight?:string|number;
    minWidth?: string|number;
    children?: React.ReactNode;
}
export class Modal extends React.Component<ModalProps, {}>{
   
    render() {
        var p = this.props;
        var style: any = {};
        var cls='';
        if (p.height) {
            style.height = p.height;
            cls+='with-height';
        }
        if(p.maxHeight)
            style.maxHeight=p.maxHeight;

        if (p.minWidth) {
            style.minWidth = p.minWidth;
        }
        return <div className={`bootbox modal fade in show ${cls}`} tabIndex={-1} role="dialog" >
                <div className="modal-dialog" style={style}>
                    <div className="modal-content" >
                        {p.children}
                    </div>
                </div>
            </div>;

        //<div className="modal-header">
                    //    {p.onClose ? <button type="button" onClick={() => p.onClose() } className="bootbox-close-button close" data-dismiss="modal" aria-hidden="true"><span className="fa fa-remove"></span></button> : null}
                    //    <h4 className="modal-title">{p.title}</h4>
                    //</div>
                    //<div className="modal-body">{p.children}</div>
                    //{p.footer ? <div className="modal-footer">{p.footer}</div> : null}
    }
}

interface ModalInstanceProps{
    component:any,
    props:any
    onClose():void;
}
class ModalInstance extends React.Component<ModalInstanceProps,{}>{
    constructor(props:ModalInstanceProps){
        super(props);
    }
    getChildContext(): any {
        return {
            onClose: this.props.onClose
        }
    }
    render(){
        return React.createElement(
            this.props.component,
            assign({onClose:this.props.onClose},this.props.props)
            );
        
    }
}
(ModalInstance as any).childContextTypes = {
    onClose: PropTypes.func
}

//export interface ModalProps {
//    id: string;
//    onClose?(): void;
//    title: JSX.Element | JSX.Element[] | string;
//    footer?: JSX.Element | JSX.Element[] | string;
//    children?: React.ReactNode;
//    height?: number|string;
//    minWidth?: number|string;
//    className?: string;
//}

export interface ModalContainerProps {
}


export class ModalContainer extends React.Component<ModalContainerProps, { modals: ModalInstanceProps[] }>{
    constructor(props: any) {
        super(props);
        this.state = { modals:[]};
    }
    componentDidMount() {
        curModalContainer = this;
    }
    attach(modal: ModalInstanceProps) {
        this.setState({
            modals: this.state.modals.concat([modal])
        });
    }
    detach(modal: ModalInstanceProps) {
        this.setState({
            modals: this.state.modals.filter(m => m != modal)
        });
    }
    update(orgModal:ModalInstanceProps,newModal: ModalInstanceProps) {
        this.setState({
            modals: this.state.modals.map(m => m==orgModal?newModal:m)
        });
    }
    render() {
        var modals = this.state.modals;
        var doms = modals.map((m, idx) => {
            return <div key={idx} className='modal-wrapper'>
                <ModalInstance component={m.component} props={m.props} onClose={m.onClose}/>
                <div className="modal-backdrop fade in show"></div>
            </div>
        }
            //<div key={idx} className="modal fade in show" tabindex= "-1" >
            //    <div className="modal-dialog">
            //        <div className="modal-content">
            //            <div className="modal-header">
            //                {p.onClose ? <button type="button" class ="close" data-dismiss="modal" aria-label="Close" onClick={() => p.onClose() } > <span aria-hidden="true">&times; </span></button> : null}
            //                <h4 className="modal-title">{p.title}</h4>
            //            </div>
            //            <div className="modal-body">
            //                {p.children}
            //            </div>
            //            {p.footer ? <div className="modal-footer">{p.footer }</div> : null}
            //        </div>
            //    </div>
            //</div>
        );
        return <div className="root-modal-container">{doms}</div>
    }
}

export interface ShowModalProps {
    closable?: boolean;
    title: JSX.Element | JSX.Element[] | string;
    footer?: JSX.Element | JSX.Element[] | string;
    children?: React.ReactNode;
    height?: number | string;
    minWidth?: number | string;
    className?: string;
}

class SimpleModal extends React.Component<ShowModalProps, {}>{
    render() {
        var p=this.props;
        return <Modal height={p.height} minWidth={p.minWidth} >
            {p.title?<ModalHeader closable={p.closable}>{p.title}</ModalHeader>:null}
            <ModalBody>{p.children}</ModalBody>
            {p.footer?<ModalFooter>{p.footer}</ModalFooter>:null}
        </Modal>;
    }
}

export interface IModal {
    promise: PromiseLike<any>,
    resolve(result?: any): void;
    reject(error: any): void;
    update(component:any, props: any): void;
}

export function showModal(component:any,props: any): IModal{
    if (!curModalContainer)
        throw "需要模式对话框容器";
    var m: IModal = null;
    var mp: ModalInstanceProps = null;
    
    var re = new Promise((resolve, reject) => {
        m = {
            promise: null,
            reject: reject,
            resolve: resolve,
            update(component:any, props: any) {
                var omp=mp;
                mp={
                    component:component || omp.component,
                    props:props,
                    onClose:resolve
                }
                curModalContainer.update(omp,mp);
            }
        };
        mp = {
            component:component,
            props:props,
            onClose:resolve
        };
        curModalContainer.attach(mp);
    });
    re.then(
        re =>
            curModalContainer.detach(mp),
        e =>
            curModalContainer.detach(mp)
    );
    m.promise = re;
    return m;
}


export function show(props: ShowModalProps): IModal{
    return showModal(SimpleModal,props);
}