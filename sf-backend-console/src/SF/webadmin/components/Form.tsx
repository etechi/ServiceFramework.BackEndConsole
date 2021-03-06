﻿import * as React from 'react'
import { Link } from 'react-router-dom'
export {Link};

export interface IIconLinkProps {
    link?: string;
    text: string;
    icon: string;
}
export class IconLink extends React.Component<IIconLinkProps, {}>
{
    render() {
        return <a href="#">
            {this.props.icon ? <i className={this.props.icon}></i> : null}
            {this.props.text}
        </a>
    }
}

export interface IButtonProps {
    link?: string;
    onClick?: () => void;
    text: string;
    icon?: string;
}
export class Button extends React.Component<IButtonProps, {}>
{
    render() {
        if (this.props.link) {
            return <Link to="/" className="btn btn-sm btn-default">
                {this.props.icon ? <i className={this.props.icon}></i> : null}
                {this.props.text}
            </Link>
        }
        else {
            return <button type="button" className="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" dropdown-menu-hover data-delay="1000" data-close-others="true">
                Actions
                <i className="fa fa-angle-down"></i>
            </button>
        }
    }
}

export interface IMenuItemProps {
    link?: string;
    icon?: string;
    text: string;
    onClick?: () => void;
}
export class MenuItem extends React.Component<IMenuItemProps, {}>
{
    render() {
        return <li>
            <Link to={this.props.link || "javascript:;"} onClick={this.props.onClick} >
                <i className="icon-user"></i> {this.props.text}
            </Link>
        </li>;
    }
}
export class MenuDivider extends React.Component<{}, {}>
{
    render() {
        return <li className="divider"> </li>;
    }
}
   
export interface IDropDownMenuProps {
    onClick?: () => void;
    text: string;
    icon: string;
    children?: React.ReactNode;
}

export class DropDownMenu extends React.Component<IDropDownMenuProps, {}>
{
    render() {
        return <div className="btn-group">
            <button type="button" className="btn btn-sm btn-default dropdown-toggle">
                {this.props.icon ? <i className={this.props.icon}></i> : null}
                {this.props.text}
                <i className="fa fa-angle-down"></i>
            </button>
            <ul className="dropdown-menu pull-right" role="menu">
                {this.props.children}
            </ul>
        </div>;
    }
}

