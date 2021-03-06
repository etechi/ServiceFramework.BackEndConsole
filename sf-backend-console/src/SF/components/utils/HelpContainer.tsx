﻿import * as React from 'react';
//import * as  ccfg from "../../utils/config";
//import { browserHistory } from 'react-router-dom'
import {createBrowserHistory} from 'history';
var browserHistory=createBrowserHistory();
export interface HelpContainerProps{
    html: string;
    className?: string;
}
export class HelpContainer extends React.Component<HelpContainerProps, {}>
{
    handleClick(e: React.MouseEvent<Element>) {
        e.preventDefault();
        e.stopPropagation();

        var t = e.target as HTMLElement;
        var a = t;
        for (var a = t; a && a != this.refs["dom"]; a = a.parentNode as HTMLElement)
            if (a.nodeName.toLowerCase() == "a")
                break;
        if (!a || a == this.refs["dom"])
            return;

        browserHistory.push((a as HTMLAnchorElement).href);
    }
    render() {
        return <div ref="dom" onClick={(e) => this.handleClick(e) } className={`help-container ${this.props.className || ''}`} dangerouslySetInnerHTML={{ __html: this.props.html }}></div>;
    }
}