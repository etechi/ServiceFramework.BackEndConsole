﻿import * as React from 'react';
import * as Modal from "./Modal";
import {EntityTable} from "../webapi/EntityTable";
import {EntityEditor} from "../webapi/EntityEditor";

interface EntityTableModalProps {
    title: string;
    controller: string;
    action: string;
    //onChange(id: any): void;
    onClose?(id:any): void;
    entityIdent: any;
    query?: any;
}
interface EntityTableModalState {
    selectedIdent: any;
}
class EntityTableModal extends React.Component<EntityTableModalProps, EntityTableModalState>{
    constructor(props: EntityTableModalProps) {
        super(props);
        this.state = { selectedIdent: props.entityIdent };
    }
    handleClose(re?:any){
        var p=this.props as any;
        if(p.onClose)
            p.onClose(re);
    }
    render() {
        var p=this.props;
        return <Modal.Modal height="90%" minWidth="90%"  >
            <Modal.ModalHeader closable={true} >{p.title}</Modal.ModalHeader>
            <Modal.ModalBody>
                <EntityTable
                    controller={this.props.controller}
                    action={this.props.action}
                    entitySelected={this.state.selectedIdent}
                    readonly={true}
                    linkTarget="_blank"
                    query={p.query}
                    onEntitySelected={(e, c) => {
                        var id = e ? e.Id : null;
                        if (c)
                            this.handleClose(id || null)
                        else
                            this.setState({ selectedIdent: id});
                    }
                    }
                    />
            </Modal.ModalBody>
            <Modal.ModalFooter>
                <div className="text-right">
                    <button className="btn btn-primary btn-sm" type="button" disabled={!this.state.selectedIdent} onClick={() => this.handleClose(this.state.selectedIdent || null) }>确定</button>
                    <button className="btn btn-default btn-sm" type="button" disabled={!this.state.selectedIdent} onClick={() => this.handleClose(null) }>清除</button>
                    <button className="btn btn-default btn-sm" type="button" onClick={()=>this.handleClose()}>关闭</button>
                </div>
            </Modal.ModalFooter>
        </Modal.Modal>
    }
}

export function showEntityTableModal(props:EntityTableModalProps){
    return Modal.showModal(EntityTableModal,props);
}

interface EntityViewModalProps {
    title:string;
    entity:string;
    ident:any;
    controller: string;
    action: string;
    onClose?(): void;
}
class EntityViewModal extends React.Component<EntityViewModalProps, {}>{
    render() {
        var p=this.props;
        return <Modal.Modal minWidth="1000px"  maxHeight="90%" >
            <Modal.ModalHeader closable={true} >{p.title}</Modal.ModalHeader>
            <Modal.ModalBody>
                <EntityEditor
                    controller={this.props.controller}
                    loadAction={this.props.action}
                    readonly={true}
                    id={this.props.ident}
                    noReturn={true}
                    />
            </Modal.ModalBody>
            <Modal.ModalFooter>
                <div className="text-right">
                    <button className="btn btn-default btn-sm" type="button" onClick={()=>this.props.onClose()}>关闭</button>
                </div>
            </Modal.ModalFooter>
        </Modal.Modal>
    }
}

export function showEntityModal(props:EntityViewModalProps){
    return Modal.showModal(EntityViewModal,props);
}

//export interface EntityTableModalArgument {
//    id: string;
//    title: string;
//    controller: string;
//    action: string;
//    onChange(id: any): void;
//    onClose(): void;
//    entityIdent: any;
//}

//function showEntityTableModal(args: EntityTableModalArgument) {
//    return show({
//        title: args.title,
//        id: args.id,
//        closable: true,
//        minWidth: "90%",
//        height: "90%",
//        footer: <div className="text-right">
//            <button className="btn btn-primary btn-sm" type="button" disabled={!this.state.selectedIdent} onClick={() => this.props.onChange(this.state.selectedIdent || null) }>确定</button>
//            <button className="btn btn-default btn-sm" type="button" disabled={!this.state.selectedIdent} onClick={() => this.props.onChange(null) }>清除</button>
//            <button className="btn btn-default btn-sm" type="button" onClick={this.props.onClose}>关闭</button>
//        </div>,
//        children: <EntityTable
//            controller={this.props.controller}
//            action={this.props.action}
//            entitySelected={this.state.selectedIdent}
//            linkTarget="_blank"
//            onEntitySelected={(e) => this.setState({ selectedIdent: e ? e.Id : null }) }
//            />
//    });
    
//}