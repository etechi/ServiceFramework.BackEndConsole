﻿import * as React from 'react'
import { Link } from 'react-router-dom'

export interface IHeadLink {
    to?: string;
    text: string 
}
export interface IHeaderProps {
    links: IHeadLink[];
    children?: React.ReactNode;
}
export class Header extends React.Component<IHeaderProps, any>{
    render() {
        return <div className="page-bar">
            <ul className="page-breadcrumb">
                <li key={-1}><Link to="/admin/">管理中心</Link> <i className="fa fa-circle"></i></li>
                {
                    this.props.links.map((hl, idx) =>
                        <li key={idx}>
                            {hl.to ? <Link to={hl.to}>{hl.text}</Link> : hl.text}
                            {idx == this.props.links.length - 1 ? null:<i className="fa fa-circle"></i>}
                        </li>
                    )
                }
            </ul>
            <div className="page-toolbar">
                  {this.props.children}
            </div>
        </div>
    }
}

export class Content extends React.Component<{ children?: React.ReactNode; }, any>{
    render() {
        return <div>{this.props.children}</div>;
    }
}
export interface IContainerProps {
    name?: string;
    style?: any;
    children?: React.ReactNode;
}
export class Container extends React.Component<IContainerProps, any> {
    constructor(props: IContainerProps) {
        super(props)
    }
    render() {
        var children = React.Children.toArray(this.props.children);
        var header = children.filter(i => (i as any).type == Header);
        var content = children.filter(i => (i as any).type == Content);
        return <div className="page-wrapper" style={this.props.style} >
            {header}
            {this.props.name ? < h3 className="page-title">{this.props.name}</h3> : null}
            {content}
        </div>
    }
}

