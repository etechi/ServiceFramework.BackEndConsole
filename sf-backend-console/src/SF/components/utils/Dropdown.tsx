﻿import * as React from 'react';

export interface Option {
    content: string | JSX.Element;
    onClick(): void;
}
export interface DropdownProps{
    tagName?: string;
    className?: string;
    options: Option[];
    children?: React.ReactNode;
}
export class Dropdown extends React.Component<DropdownProps, { open?: boolean }>{
    constructor(props: any) {
        super(props);
        this.state = { open: false };
    }
    componentDidMount() {
    }
    _timer: any;
    componentWillUnmount() {
        if (this._timer)
            clearTimeout(this._timer);
    }
    handleOpen() {
        this._timer = setTimeout(() => {
            this._timer = null;

            var h = e=>{
                document.body.removeEventListener("mouseup", h);
                this._timer = setTimeout(() => {
                    this._timer = null;
                    this.setState({ open: false });
                }, 10);
            };
            document.body.addEventListener("mouseup", h);
        }, 10);
        this.setState({ open: true });
    }
    render() {
        return (React.createElement as any)(
            this.props.tagName || "div",
            {
                className: (this.props.className || "dropdown") + (this.state.open ? ' open' : '')
            },
            <button className="btn btn-default" type="button" onClick={() => this.handleOpen() } >
                {this.props.children}
                <span className="caret"></span>
            </button>,
            this.state.open? <ul className= "dropdown-menu" >
            {
                    this.props.options.map((o, i) =>
                        o ? <li key={i}><a href="javascript:;" onClick={() => o.onClick() } >{o.content}</a></li> :
                        <li key={i} role="separator" className="divider"></li>
                )
            }
            </ul >:null
            );
    }
}

export interface DropListProps {
    tagName?: string;
    className?: string;
    value: any;
    options: { content: string | JSX.Element, value: any }[];
    onChange(value: any):void;
}

export class DropList extends React.Component<DropListProps, {}>{
    render() {
        var idx = -1;
        var options = this.props.options;
        for (var i = 0; i < options.length; i++)
            if (options[i].value == this.props.value) {
                idx = i;
                break;
            }
        return <Dropdown
            tagName={this.props.tagName}
            className={this.props.className}
            options={
            this.props.options.map(o => (o?{
                content: o.content,
                onClick: () => this.props.onChange(o.value)
            }:null))
        }>{idx == -1 ? "-" : options[idx].content}</Dropdown>
    }
}