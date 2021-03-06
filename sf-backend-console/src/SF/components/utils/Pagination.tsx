﻿import * as React from 'react';

export interface PaginationProps {
    title?: string;
    total: number;
    current: number;
    itemsPerPage: number;
    buttonCount?: number;
    onClick(offset: number,count:number): void;
    className?: string;
}

export class Pagination extends React.Component<PaginationProps, {}>
{
    constructor(props:any){ 
        super(props); 
    }

    render() {
        var ps = this.props;
        var click = ps.onClick;

        var itemsPerPage = ps.itemsPerPage;
        var page = Math.floor(ps.current / itemsPerPage);
        var pageCount = Math.floor(ps.total / itemsPerPage);
        if (ps.total % ps.itemsPerPage)
            pageCount++;

        var btnCount = ps.buttonCount || 7;
        var begin = page - Math.floor(btnCount / 2);
        if (begin < 0) begin = 0;

        var end = begin + btnCount;
        if (end >= pageCount) {
            end = pageCount;
            begin = end - btnCount;
            if (begin < 0) begin = 0;
        }

        var new_item = (idx:number,title?:string) =>
            <li key={idx} className='pg' onClick={() => click(idx * itemsPerPage, itemsPerPage) } >{title?title:(idx + 1)}</li>

        var items: any[] = [];
        if (ps.title)
            items.push(<li key='title' className='title'>{ps.title}</li>);

        if (begin > 0)
            items.push(new_item(0));
        if (begin > 1)
            items.push(<li key='sp1' className="sp">...</li>);
        for (var i = begin; i < end; i++)
            if (i == page)
                items.push(<li key='active' className="active">{i + 1}</li>);
            else
                items.push(new_item(i));

        if (end < pageCount - 1)
            items.push(<li key='sp2' className="sp">...</li>);

        if (end < pageCount)
            items.push(new_item(pageCount - 1));
        //if (pageCount > 0) {
        //    if (page > 0) items.push(new_item(page - 1, "<<"));
        //    if (page < pageCount - 1) items.push(new_item(page + 1, ">>"));
        //}
        items.push(<li key='total' className='total'>{`共${ps.total}条记录`}</li>);
        items.push(<li key='itemsPerPage' className='options'>
            <select value={ps.itemsPerPage} onChange={(e) => {
                var items = (e.target as any).value;
                click(Math.floor(ps.current / items) * items, items);
                } }>
                <option value={20}>每页20条</option>
                <option value={50}>每页50条</option>
                <option value={100}>每页100条</option>
                <option value={200}>每页200条</option>
                <option value={500}>每页500条</option>
                <option value={1000}>每页1000条</option>
            </select>
         </li>);

        return <nav className={ps.className} >
            <ul className="pagination pagination-sm">
                {items}
            </ul> 
        </nav>
    }
}