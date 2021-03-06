﻿import * as React from 'react';
import {EntityTable, IActionBuilder} from "../../../components/webapi/EntityTable";
import * as Page from "../Page"
import {Link} from "react-router-dom";
export interface ListViewArgs {
    links: Page.IHeadLink[];
    controller: string;
    action: string;
    serviceId?: number;
    children?: React.ReactNode;
    header?: JSX.Element[] | JSX.Element;
    headerLinks?: Page.IHeadLink[];
    headerActionBuilders?: IActionBuilder[];
    titleLinkBuilder?(ids: any[]): string;
    actionBuilders?: IActionBuilder[];
    readonly?: boolean;
}
interface ListViewProps
{
    location?: { query: any };
    match?:any
}
export default function ListView(args: ListViewArgs ) {
    return class ListView extends React.Component<ListViewProps, {}>{
        componentWillReceiveProps(nextProps: ListViewProps, nextContext: any): void
        {
            //从子页进入到当前页时，需要刷新表格
            if (!this.props.match.isExact && this.props.match.isExact)
                setTimeout(() =>
                    (this.refs["table"] as any).refresh(),
                    1);
        }  
        render() {
            var isExact=this.props.match.isExact;
            var refresh = () =>
                (this.refs["table"] as any).refresh();
            var fs = this.props.location && this.props.location.query && this.props.location.query.filter || null;
            var filter = fs && JSON.parse(fs) || null; 
            //var filter = this.props.location && this.props.location.query || null;
            return <Page.Container style={{ display: isExact ? 'block' : 'none' } }  >
                    <Page.Header >{/*nav={args.links}*/}
                        {args.header || null}
                        {args.headerLinks && args.headerLinks.map((l, i) =>
                            <Link key={"l"+i} className="btn btn-primary" to= {l.to} >{l.text}</Link>
                        ) || null}
                        {
                            args.headerActionBuilders && args.headerActionBuilders.map((a, i) =>
                                a.build(null, i, refresh)
                            ) || null
                        }
                    </Page.Header>
                    <Page.Content>
                        <EntityTable
                            ref="table"
                            controller={args.controller}
                            action={args.action}
                            serviceId={args.serviceId}
                            className="full-page-list"
                            titleLinkBuilder={args.titleLinkBuilder}
                            actions={args.actionBuilders}
                            readonly={args.readonly}
                            query={filter} 
                            />
                    </Page.Content>
                </Page.Container>

        }
    }
}

