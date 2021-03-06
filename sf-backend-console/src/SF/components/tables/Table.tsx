﻿import * as React from 'react'
declare var require: any;
var FDT = require('fixed-data-table');
var FTable = FDT.Table;
var FColumn = FDT.Column;
var FGroup = FDT.Group;
var FCell = FDT.Cell;

export interface ColumnItem {
    fixed?: boolean;
    align?: "left" | "center" | "right";
    header?: string;
    columnKey?: string | number;
}
export interface CellBuilder{
    (props: { rowIndex: number; colKey?: string; height?: number; width?: number; }): JSX.Element | string;
}
export interface Column extends ColumnItem{
    width: number;
    flexGrow?: number;
    cell: CellBuilder;
    footer?(props: { rowIndex: number; columnKey: string; height: number; width: number; }): JSX.Element;
}
export interface Group extends ColumnItem {
    columns: ColumnItem[]
}
export interface TableProps{
    width: number;
    height: number;
    rowHeight?: number;
    rowsCount: number;
    headerHeight?: number;
    onRowClick?(row: number): void;
    onRowDoubleClick?(row: number): void;
    columns: ColumnItem[];
    rowClassNameGetter?(row: number): string;
    onColumnResizeEndCallback?(width: number, columnKey: any):void;
}
function buildGroup(c: Group,idx:number) {
    return <FGroup
        key={idx}
        align={c.align || "center"}
        fixed={c.fixed || false}
        header={c.header}
        >{buildColumnItems((c as any).columns) }</FGroup>;
}
function buildColumn(c: Column,idx:number) {
    return <FColumn
        key={idx}
        align={c.align || "center"}
        fixed={c.fixed || false}
        header={c.header}
        cell={(props) => <FCell {...props}>{c.cell(props) }</FCell>}
        footer={c.footer || null}
        columnKey={c.columnKey}
        width={c.width}
        flexGrow={c.flexGrow}
        isResizable={true}
        allowCellsRecycling={true}
        />;
}
function buildColumnItems(cols: ColumnItem[]) {
    return cols.map((c, idx) =>
        (c as Group).columns ?
            buildGroup(c as Group,idx) :
            buildColumn(c as Column,idx)
    )
}

export class Table extends React.Component<TableProps, {}>{
    render() {
        return <FTable
            width={this.props.width}
            height={this.props.height}
            rowHeight={this.props.rowHeight || 30}
            rowsCount={this.props.rowsCount}
            headerHeight={this.props.headerHeight || this.props.rowHeight || 30}
            onRowClick={(e, idx) => { if (this.props.onRowClick) this.props.onRowClick(idx) } }
            onRowDoubleClick={(e, idx) => { if (this.props.onRowDoubleClick) this.props.onRowDoubleClick(idx) } }
            onColumnResizeEndCallback={this.props.onColumnResizeEndCallback || null}
            isColumnResizing={false}
            rowClassNameGetter={this.props.rowClassNameGetter}
            >{buildColumnItems(this.props.columns) }</FTable>
    }
}

