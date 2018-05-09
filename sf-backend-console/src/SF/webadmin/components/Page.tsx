import * as React from 'react'
import { Link } from 'react-router-dom'

export interface IHeadLink {
    to?: string;
    text: string 
}
export interface IHeaderProps {
    title?: string;
    nav?: React.ReactNode;
    children?: React.ReactNode;
}
export class Header extends React.Component<IHeaderProps, any>{
    render() {
        return <div className="page-bar">
            {this.props.title ? <label style={{ float: 'left', margin: "10px 10px 0 0", fontSize: "16px", fontFamily: "微软雅黑" }}>{this.props.title}</label> : null}
            {/* <ul className="page-breadcrumb">
                {
                    this.props.links && this.props.links.map((hl, idx) =>
                        <li key={idx}>
                            {hl.to ? <Link to={hl.to}>{hl.text}</Link> : hl.text}
                            {idx == this.props.links.length - 1 ? null:<i className="fa fa-circle"></i>}
                        </li>
                    ) || null
                }
            </ul> */}
            <div className="tabbable-line" style={{float:"left",margin:"5px 0 0 16px"}}>
            <div className="nav nav-tabs">
                {this.props.nav}
                </div>
            </div>
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
        if (header.length == 0) header = [children[0]];
        var content = children.filter(i => (i as any).type == Content);
        return <div className="page-wrapper" style={this.props.style} >
            {header}
            {this.props.name ? < h3 className="page-title">{this.props.name}</h3> : null}
            {content}
        </div>
    }
}

