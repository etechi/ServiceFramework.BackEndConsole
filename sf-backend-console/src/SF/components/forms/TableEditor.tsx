﻿import * as React from 'react'
import  assign  from "../../utils/assign";
//import * as  RForm from "redux-form"; 
import * as FI from "./FormItem";
import * as Editors from "../editors";
import {Dropdown} from "../utils/Dropdown";

export interface IColumn{
    name: string;
    help: string;
    key: string;
    render: FI.FormRender;
    props: Editors.IBaseEditorProps;
    required: boolean;
    meta?(pnt: Editors.MetaData): Editors.MetaData;
    value?(row: any): any;
    onChange?(row: any, meta: Editors.MetaData, handle:(e: Editors.ChangeEvent, key: string)=>void): (e: Editors.ChangeEvent) => void;
}
export interface TableEditorProps {
    disabled?: boolean;
    className?: string;
    value: any[];
    meta?: Editors.MetaData;
    onChange(e: Editors.ChangeEvent): void;
    readonly?: boolean;
    title?: string;
    renderContext?: FI.IRenderContext;
    cols: IColumn[];
    maxLength?: number;
    rowKey(row: any): any;
    newRow?(): any;
}
interface IRowState {

}
export interface state {
    activeRow?: number;
    rowStates?: IRowState[];
}

export class TableEditor extends React.Component<TableEditorProps, state>
{
    constructor(props: TableEditorProps) {
        super(props);
        this.state = {
            rowStates: [],
            activeRow:-1
        };
    }
    handleRowClick(e: React.FormEvent<Element>, r) {
        this.setState({ activeRow: r });
        e.stopPropagation();
    }
    handleCellChange(e: Editors.ChangeEvent, row: any, meta: Editors.MetaData, index: number, key: string) {
        e = e.
            newObjectUpperEvent(key, row, meta).
            newArrayUpperEvent(index, this.props.value, this.props.meta);
        this.props.onChange(e);
    }
    handleMoveUp(r, idx) {
        var e=Editors.ChangeEvent.newArrayMoveEvent(
            this.props.value,
            this.props.meta,
            idx,
            1,
            idx - 1
        );
        this.props.onChange(e);
    }
    handleMoveDown(r, idx) {
        var e = Editors.ChangeEvent.newArrayMoveEvent(
            this.props.value,
            this.props.meta,
            idx,
            1,
            idx + 2
        );
        this.props.onChange(e);
    }
    handleRemove(r, idx) {
        var e = Editors.ChangeEvent.newArraySpliceEvent(
            this.props.value,
            this.props.meta,
            idx,
            1,
            []
        );
        this.props.onChange(e);
        this.setState({ activeRow: -1});
    }
    handleInsertRow(idx: number) {
        var e = Editors.ChangeEvent.newArraySpliceEvent(
            this.props.value,
            this.props.meta,
            idx,
            0,
            [this.props.newRow ? this.props.newRow() : {}]
        );
        this.props.onChange(e);
        this.setState({ activeRow: idx });
    }
    handleInsertFirst() {
        this.handleInsertRow(0);
    }
    handleInsertLast() {
        var idx = this.props.value && this.props.value.length || 0;
        this.handleInsertRow(idx);
    }
    handleRemoveAll() {
        if (!confirm("您确定要清除所有项目么？保存前可以通过重置表单来恢复这些项目"))
            return;
        var e = Editors.ChangeEvent.newArraySpliceEvent(
            this.props.value,
            this.props.meta,
            0,
            this.props.value && this.props.value.length || 0,
            []
        );
        this.props.onChange(e);
        this.setState({ activeRow: -1 });
    }
    render() {
        const {maxLength,className, cols, value, meta, rowKey, renderContext, disabled} = this.props;
        const {activeRow} = this.state;
        var headers = cols.map((h, i) =>
            <th key={i} title={h.help} className={h.required?"field-required":null} >{h.name}</th>
        );
        var crc = FI.renderContextPushPath(renderContext,value);
        var rows = (value || []).map((rvalue, index) => {
            var ccrc = FI.renderContextPushPath(renderContext, rvalue);
            var rmeta = meta && meta.child(index) || null;
            return <tr key={rowKey && rowKey(rvalue) || index} onClick={(e) => this.handleRowClick(e,rvalue) } className={activeRow == rvalue ? 'active' : ''}>
                <td key="number" className="text-center">{index+1}</td>
                {
                    cols.map((c, i) => {
                        var m = rmeta && (c.meta ? c.meta(rmeta) : rmeta.child(c.key)) || null;
                        var v = c.value ? c.value(rvalue) : rvalue[c.key];
                        var props = assign(c.props, {
                            value: v,
                            meta: m,
                            onChange: c.onChange ? c.onChange(
                                    rvalue,rmeta,
                                    (e: Editors.ChangeEvent, key: string) =>
                                        this.handleCellChange(e, rvalue, rmeta, index, c.key)
                                    ) :
                                (e: Editors.ChangeEvent) =>
                                this.handleCellChange(e, rvalue, rmeta, index, c.key)
                        });

                        return <td key={c.key} className={`${m && m.changed ? 'touched' : ''} ${m && m.hasError ? 'error' : ''}`}>
                            {c.render(props,ccrc)}
                            {m && m.changed && m.error ? <span className="cell-error">{m.error}</span> : null}
                        </td>
                    }
                    ) }
                {disabled ? null : < td key='actions' className="actions">
                    <div className="btn-group btn-group-xs">
                        <button className="btn btn-default" type="button" disabled={index === 0} onClick={() => this.handleMoveUp(rvalue, index) }><span className="fa fa-angle-up"></span></button>
                        <button className="btn btn-default" type="button" disabled={index === value.length - 1} onClick={() => this.handleMoveDown(rvalue, index) }><span className="fa fa-angle-down"></span></button>
                        <Dropdown className="btn btn-default" options={
                            [
                                {
                                    content: "在上方插入",
                                    onClick: () => this.handleInsertRow(index)
                                },
                                {
                                    content: "在下方插入",
                                    onClick: () => this.handleInsertRow(index + 1)
                                },
                                null,
                                {
                                    content: "删除",
                                    onClick: () => this.handleRemove(rvalue, index)
                                }
                            ]
                        }/>
                    </div>
                </td>}
            </tr>;
        });
        return <table className={`form-table-editor ${className || ''}`}>
            <tbody>
            <tr className='form-table-editor-header'>
                <th className="text-center">#</th>
                {headers}
                {disabled ? null : <th className="actions"><div className="btn-group btn-group-xs">
                    {!maxLength || (value && value.length < maxLength) ? <button className="btn btn-default" onClick={() => this.handleInsertFirst() }>添加</button> : null}
                    <Dropdown className="btn btn-default" options={
                        [
                            {
                                content: "在头部添加",
                                onClick: () => this.handleInsertFirst()
                            },
                            {
                                content: "在尾部添加",
                                onClick: () => this.handleInsertLast()
                            },
                            null,
                            {
                                content: "删除所有项目",
                                onClick: () => this.handleRemoveAll()
                            }
                        ]
                    }/>
                </div></th>}
            </tr>
            {rows}
            </tbody>
        </table>
    }
}