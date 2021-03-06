﻿import * as React from 'react'
import { Link } from 'react-router-dom'

export class Logo extends React.Component<{ children?:React.ReactNode }, any> {
    render() {
        return <div className="page-logo">
            <Link to="/">
                {/*<img src="{{settings.layoutPath}}/img/logo.png" alt="logo" class="logo-default" />*/}
                <h2 className="logo-default" >{this.props.children}</h2>
            </Link>
            <div className="menu-toggler sidebar-toggler">
                {/*DOC: Remove the above "hide" to enable the sidebar toggler button on header*/}
            </div>
        </div>
    }
}

export class SearchBox extends React.Component<any, any> {
    render() {
        return <form className="search-form" action="#" method="GET">
            <div className="input-group">
                <input type="text" className="form-control" placeholder="Search..." name="query"/>
                <span className="input-group-btn">
                    <a href="javascript:;" className="btn submit">
                        <i className="icon-magnifier"></i>
                    </a>
                </span>
            </div>
        </form>
    }
}

export interface ButtonProps {
    onClick?(): void;
    children?: React.ReactNode;
}

export class Button extends React.Component<ButtonProps, any> {
    render() {
        //return <li className="dropdown dropdown-quick-sidebar-toggler">
        //    <a href="javascript:;" className="dropdown-toggle">
        //        <i className="icon-logout"></i>
        //    </a>
        //</li>
        return <li className="dropdown dropdown-quick-sidebar-toggler">
            <a href="javascript:;" className="dropdown-toggle" onClick={this.props.onClick}>
                {this.props.children}
            </a>
        </li>
    }
}

export interface TextProps {
    to?: string;
    children?: React.ReactNode;
}

export class Text extends React.Component<TextProps, any> {
    render() {
        //return <li className="dropdown dropdown-quick-sidebar-toggler">
        //    <a href="javascript:;" className="dropdown-toggle">
        //        <i className="icon-logout"></i>
        //    </a>
        //</li>
        return <li className="dropdown dropdown-user">
            {this.props.to ?
                <Link to={this.props.to} className="dropdown-toggle">
                    {this.props.children}
                </Link>
                :
                <a href="javascript:;" className="dropdown-toggle">
                    {this.props.children}
                </a>}
        </li>
    }
}
export interface DropDownButtonProperty {
    icon: string;
    badge?: string;
    class?: string;
    message: string;
    detailLink: string;
    children?: React.ReactNode;
}

export class DropDownButton extends React.Component<DropDownButtonProperty, any> {
    constructor(props: DropDownButtonProperty) {
        super(props)
    }
    render() {
        return <li className={"dropdown dropdown-extended " + (this.props.class || "") }>
            <a href="#" className="dropdown-toggle" dropdown-menu-hover data-toggle="dropdown" data-close-others="true">
                <i className={this.props.icon}></i>
                {this.props.badge ? <span className="badge badge-default"> {this.props.badge} </span> : null}
            </a>
            <ul className="dropdown-menu extended">
                <li className="external">
                    <h3>{this.props.message}</h3>
                    <Link to={this.props.detailLink}>更多...</Link>
                </li>
                <li>
                    <ul className="dropdown-menu-list scroller" style={{ height: "275px;" }} data-handle-color="#637283">
                        {this.props.children}
                        {/*<li>
                            <a href="javascript:;">
                                <span class="task">
                                    <span class="desc">New release v1.2 </span>
                                    <span class="percent">30%</span>
                                </span>
                                <span class="progress">
                                    <span style="width: 40%;" class="progress-bar progress-bar-success" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
                                        <span class="sr-only">40% Complete</span>
                                    </span>
                                </span>
                            </a> 
                        </li>*/}

                    </ul>
                </li>
            </ul>
        </li>
    }
}

export interface ContainerProperty {
    children?: React.ReactNode;
}
 
export class Container extends React.Component<ContainerProperty, any> {
    constructor(props: ContainerProperty) {
        super(props)
    }
    render() {
        var logo = React.Children.toArray(this.props.children).filter(i => (i as any).type == Logo);
        var searchbox =React.Children.toArray(this.props.children).filter(i => (i as any).type == SearchBox);
        var children = React.Children.toArray(this.props.children).filter(i => (i as any).type != Logo && (i as any).type!=SearchBox);

        return <div className="page-header-inner">
            {logo}
            {searchbox}
            <a href="javascript:;" className="menu-toggler responsive-toggler" data-toggle="collapse" data-target=".navbar-collapse"> </a>
            <div className="top-menu">
                <ul className="nav navbar-nav pull-right">
                    {children}
                </ul>
            </div>
        </div>
    }
}
