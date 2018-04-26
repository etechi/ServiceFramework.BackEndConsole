import * as React from 'react'
import * as ReactRouter from 'react-router'
import * as apicall from '../../utils/apicall';
import * as Views from '../components/Views';
import * as Page from "../components/Page"

import { EntityTable, IActionBuilder } from "../../components/webapi/EntityTable";
import { Link } from "react-router-dom";
import * as ApiMeta from "../../utils/ApiMeta";
import {PageCache} from "./PageCache";
import { ICachedPage, IPageContentRefer } from "./PageTypes";
import PageHeader from "./PageHeader";

export interface IServicePageProps {
    match: ReactRouter.match<{ path: string }>;
    location: any;
}

interface state {
    page?: ICachedPage,
}


export default function BuildPage(lib: ApiMeta.Library,permissions:{[index:string]:string}) {
    var pc=new PageCache(permissions);
    return class AutoPage extends React.Component<IServicePageProps, state> {
        constructor(props: IServicePageProps) {
            super(props);
            var path = props.location.pathname;
            var p = pc.tryLoad(path);
            this.state = { page: p};
            if (!p)
            pc.load(lib, path).then(p =>
                    this.setState({ page: p})
                );
        }
        componentWillReceiveProps(nextProps: Readonly<IServicePageProps>, nextContext: any) {
            var newPath = nextProps.location.pathname;
            if (this.state.page && this.state.page.path == newPath)
                return;
            var p = pc.tryLoad(newPath);
            if (p)
                this.setState({ page: p });
            else
                pc.load(lib, newPath).then(p =>
                    this.setState({ page: p})
                );
        } 
        header: any;
        headChild: any;
        render() {
            var p = this.props;
            var page = this.state.page;
            return <Page.Container >
                <PageHeader
                    ref={h => {
                        this.header = h;
                        if (this.headChild) {
                            h.setChildContent(this.headChild);
                            this.headChild = null;
                        }
                    }}
                    title={page ? page.title : null}
                    links={page ? page.links : []}
                />
                <Page.Content>
                    {page ? React.createElement(
                        page.component, {
                            ref: "content",
                            head: (head) => {
                                if (this.header) this.header.setChildContent(head);
                                else this.headChild = head;
                            },
                            location: p.location,
                            match: p.match
                        }) : <div>载入中...</div>}
                </Page.Content>
            </Page.Container>
        }
    }
}