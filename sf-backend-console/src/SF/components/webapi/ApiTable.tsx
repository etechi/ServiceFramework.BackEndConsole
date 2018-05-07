import * as React from 'react'
import {Table, Column, ColumnItem, Group} from "../tables/Table";
import * as  apicall  from "../../utils/apicall";
import * as ApiTableManager from "./ApiTableManager";
import {TableConfig} from "./ApiTableBuilder";
import  assign  from "../../utils/assign";
import {ApiForm} from "./ApiForm";
import {LoadManager} from "../utils/LoadManager";
import {Pagination} from "../utils/Pagination";
import * as Editors from "../editors";
import {Dropdown} from "../utils/Dropdown";

import * as  SizeMonitor  from "../../utils/SizeMonitor";
export interface RowCellBuilder {
    (rows: any[], props?: { rowIndex: number; colKey?: string; height?: number; width?: number; }): JSX.Element[] | JSX.Element | string;
}
export interface ExtraColumn extends ColumnItem {
    width: number;
    flexGrow?: number;
    extraCell: RowCellBuilder ;
    footer?(props: { rowIndex: number; columnKey: string; height: number; width: number; }): JSX.Element;
}
export interface ApiTableProps {
    controller: string;
    serviceId?: number;
    action: string;
    rowsHeight?: number;
    headerHeight?: number;
    className?: string;
    entityLinkBase?: string;
    hideQueryPanel?: boolean;
    onRowClick?: (row) => void; 
    onRowDoubleClick?: (row) => void; 
    extraColumns?: ExtraColumn[];
    linkTarget?: string;
    rowClassNameGetter?(row: any): string;
    titleLinkBuilder?(ids: any[]): string;
    query?: any;
    onQueryChanged?(q:any):void;
}
interface state {
    cols?: ColumnItem[];
    loadKey?: any;
    resolve?: any;
    reject?: any;
    colWithAdjuestLoadKey?: any;
    width?: number;
    height?: number;
    rows?: any[];
    pgOffset?: number;
    pgTotal?: number;
    pgItemsPerPage?: number;
    status?: string;
    query?:any; //查询状态
    args?: any;//已提交的参数
    filter?:any; //正在编辑的参数
}

function updateColumnWidth(cols: ColumnItem[], idents:string[], idx:number,width:number) {
    return cols.map(c => {
        if (c.columnKey != idents[idx])
            return c;
        if (idx == idents.length - 1)
            return assign(c, { width: width } as any);
        return assign(c, {
            columns: updateColumnWidth((c as Group).columns, idents, idx + 1, width)
        } as any);
    });
}



var __loadKey = 0;
export class ApiTable extends React.Component<ApiTableProps, state>
{
    cfg: TableConfig;
    constructor(props: any) {
        super(props);
        this.cfg = ApiTableManager.defaultTableManager().table(this.props.controller, this.props.action);
        var q=props.query || null;
        if(q)q=JSON.parse(q);
        var args=q && q.args || null
        this.state = {
            width: 0, 
            height: 0, 
            cols: [], 
            rows: [], 
            pgItemsPerPage:q && q.pgIPP || 20, 
            pgOffset: q && q.pgO || 0, 
            pgTotal: q && q.pgT || 0,
            args:args,
            filter:args || {},
            query:q 
            };
    }
    componentWillReceiveProps(nextProps: ApiTableProps, nextContext: any): void {
        if (nextProps.query != this.props.query) {
            var q=nextProps.query && JSON.parse(nextProps.query) || {};
            this.setState({
                args:q.args,
                filter:q.args || {},
                query: nextProps.query,
                loadKey: "lk" + (__loadKey++),
                pgOffset: q && q.pgO || 0,
                pgItemsPerPage:q && q.pgIPP || this.state.pgItemsPerPage || 20,
                pgTotal: q && q.pgT || 0
            });
        }
    }

    _sizeMonitor: () => void;
    componentDidMount() {
        this._sizeMonitor = SizeMonitor.monitor(this.refs["dom"] as any, (w, h) => {
            var domFilter = this.refs["filter"] as HTMLDivElement;
            var domFooter = this.refs["footer"] as HTMLDivElement;
            this.setState({
                width: w,
                height: h - (domFilter && domFilter.offsetHeight || 0) - (domFooter && domFooter.offsetHeight ||0)
            });
        });
        var isSelectTable = !this.props.onRowClick;
        this.setState({
            cols: this.cfg.columns.map(c => c.build({ isSelectTable: isSelectTable, rows: null, lib: ApiTableManager.defaultTableManager().library() }))
        });
    }
    componentWillUnmount() {
        if (this._sizeMonitor) {
            this._sizeMonitor();
            this._sizeMonitor = null;
        }
    }
    handleColumnResizeEndCallback(w: number, ck: string) {
        var ps =ck && ck.split('/') || [undefined];
        this.setState({
            cols: updateColumnWidth(this.state.cols, ps, 0, w)
        })
    }
    handleOnSubmit(data:any) {
        if(this.props.onQueryChanged)
        {
            this.props.onQueryChanged(JSON.stringify({
                pgO:0,
                pgIPP:this.state.pgItemsPerPage || 20,
                pgT:0,
                args:data
            })
            );
            return Promise.resolve(data);
        }
        return new Promise<any>((resolve, reject) => {
            this.setState({
                args: data,
                loadKey: "lk" + (__loadKey++),
                resolve: ()=>resolve(data),
                reject: reject,
                pgOffset: 0,
                pgTotal: 0
            });
        });
    }
    refresh() {
        this.setState({
            loadKey: "lk" + (__loadKey++)
        });
    }
    handleLoad(pgx: any) {
        var pg: apicall.IQueryPaging = {
            limit: this.state.pgItemsPerPage || 20,
            offset: this.state.pgOffset,
            totalRequired: this.state.pgTotal == 0,
            summaryRequired: this.state.pgTotal == 0,
        };
        this.setState({ status: "数据载入中..." });
        var args=this.state.args;
        if(args && args.Id && args.Id.Id==="") delete args.Id;
        return ApiTableManager.defaultTableManager().library().call(
            this.props.controller,
            this.props.action,
            args || {},
            { paging: pg, serviceId: this.props.serviceId })
            .then((re: any) => {
                var total = re.Total || this.state.pgTotal;
                var summary = re.Summary;
                if (summary) {
                    var sitems = [];
                    for (var k in summary) {
                        if (k == 'Count') continue;
                        sitems.push(k + ":" + summary[k]);
                    }
                    summary = "累计: " + sitems.join(" ");
                }
             if (this.state.resolve) {
                 this.state.resolve(null);
                 this.setState({ status: summary ? summary :re.Items && re.Items.length || re.length ?'':'未找到记录', resolve: null, reject: null, pgTotal: total })
             }
             else
                 this.setState({ status: summary ? summary : re.Items && re.Items.length || re.length ? '' : '未找到记录',pgTotal: total});
            return re && re.Items || re;
        }, e => {
            if (this.state.resolve) {
                this.state.reject(e);
                this.setState({ resolve: null, reject: null,status:'数据载入失败!' })
            }
            else
                this.setState({ resolve: null, reject: null, status: '数据载入失败!' })
            return e;
        })
    }
    handleDataAvailable(data: any) {
        var lib = ApiTableManager.defaultTableManager().library();
        var isSelectTable = !!this.props.onRowClick;
        var itemLinkBuilder = this.props.titleLinkBuilder;
        var cols = this.cfg.columns.map(c =>
            c.build({
                rows: data,
                lib: ApiTableManager.defaultTableManager().library(),
                isSelectTable: isSelectTable,
                titleLinkWrapper: itemLinkBuilder
            })
        );
        if (this.props.extraColumns)
            cols = cols.concat(
                this.props.extraColumns.map(ec =>
                    assign(ec as any, {
                        cell: (props) =>
                            ec.extraCell(data, props)
                    } as any)
                ));
        this.setState({ cols: cols,rows:data });
    }
    handleSubmit() {
        (this.refs["form"] as any).submit();
    }
    autoFilterTimer: any = null;
    handleFilterChanged(v: any) {
        this.setState({ filter: v });
    }
    render() {
        var rowClassNameGetter = !this.props.rowClassNameGetter ? null : idx => this.props.rowClassNameGetter(this.state.rows[idx] || null);
        return <div ref="dom" className={`api-table data-table ${this.props.className || ''} ${this.props.onRowClick?'':'selectable'}`}>
            {!this.props.hideQueryPanel && this.cfg.hasParams && <div ref="filter" className="filter-panel">
                <ApiForm
                    ref="form"
                    controller={this.props.controller}
                    action={this.props.action}
                    hertMode={true}
                    value={this.state.filter}
                    onChange={v => this.handleFilterChanged(v)}
                    className={"filter-form"}
                    onSubmit={(data) => this.handleOnSubmit(data) }
                    autoSubmitTimeout={1000}
                    onBuildSubmitPanel={(props: Editors.IBaseEditorProps, state: Editors.IFormState) =>
                        <div className="btn-group btn-group-sm search">
                            <button className="btn btn-primary " disabled={state.submitting} onClick={() => this.handleSubmit() }><i className={state.submitting ? 'fa fa-cog fa-spin' : 'fa fa-search'}/> 查找</button>
                            <Dropdown className="btn btn-primary" options={
                                [
                                    {
                                        content: "清除条件",
                                        onClick: () => {
                                            if(this.props.onQueryChanged)
                                            {
                                                this.props.onQueryChanged(
                                                    JSON.stringify({
                                                        pgO:0,
                                                        pgIPP:this.state.pgItemsPerPage,
                                                        pgT:0
                                                    })
                                                );
                                                return;
                                            }
                                            this.setState({
                                                args: null,
                                                filter: {},
                                                query:null,
                                                loadKey: "lk" + (__loadKey++),
                                                pgOffset: 0,
                                                pgTotal: 0
                                            });
                                        }
                                    },
                                    {
                                        content: "导出筛选数据",
                                        onClick: () => {
                                            window.open(`/api/BackEndConsoleExport/Export?Service=${this.props.controller}&Method=${this.props.action}&Mode=table&Format=excel&Argument=${encodeURIComponent(JSON.stringify(this.state.args))}&Token=${encodeURIComponent(apicall.getAccessToken())}`);
                                        }
                                    }
                                ]
                            }/>
                        </div>

                       
                    }
                    />
            </div> || null}
            <Table
                width={this.state.width}
                height={this.state.height}
                rowHeight={this.props.rowsHeight}
                rowsCount={this.state.rows.length}
                headerHeight={this.props.headerHeight}
                rowClassNameGetter={rowClassNameGetter}
                onRowClick={(idx) => { this.props.onRowClick && this.props.onRowClick(this.state.rows[idx]) } }
                onRowDoubleClick={(idx) => { this.props.onRowDoubleClick && this.props.onRowDoubleClick(this.state.rows[idx]) } }
                onColumnResizeEndCallback={(w, ck) => this.handleColumnResizeEndCallback(w,ck)}
                columns={this.state.cols}
                />
            <div ref="footer" className="table-footer">
                <div className='status'>{this.state.status}</div>
                {this.cfg.pagingSupported ?
                    <Pagination
                        className="paging"
                        title="分页:"
                        total={this.state.pgTotal}
                        current={this.state.pgOffset}
                        itemsPerPage={this.state.pgItemsPerPage}
                        onClick={(o, c) => {
                            if(this.props.onQueryChanged)
                            {
                                this.props.onQueryChanged(
                                    JSON.stringify({
                                        pgO:o,
                                        pgIPP:c,
                                        pgT:this.state.pgTotal || 0,
                                        args:this.state.args
                                    })
                                );
                                return;
                            }
                            this.setState({ pgOffset: o, pgItemsPerPage: c, loadKey: "lk" + (__loadKey++) });
                        } }
                        /> : null
                }
            </div>
            <LoadManager
                useWait={true}
                onLoad={(pg) => this.handleLoad(pg)}
                onDataAvailable={(data) => this.handleDataAvailable(data)}
                disableScrollToLoad={true}
                loadKey={this.state.loadKey}
                />
        </div>
    }

}
