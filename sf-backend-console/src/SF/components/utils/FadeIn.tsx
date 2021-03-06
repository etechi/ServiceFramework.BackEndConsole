﻿import * as React from 'react';
declare var require: any;
var ReactCSSTransitionGroup = require('react-addons-css-transition-group');

export interface FadeInProps {
    children?: React.ReactNode;
    component?:any;
    className?:string;
    transitionName?:string;
    transitionEnterTimeout?:number;
    transitionLeaveTimeout?:number; 
}
export class FadeIn extends React.Component<FadeInProps, {}>
{
    render() {
        return <ReactCSSTransitionGroup 
            component={this.props.component} 
            className={this.props.className} 
            transitionName={this.props.transitionName || 'component-fadein'} 
            transitionEnterTimeout={this.props.transitionEnterTimeout || 200} 
            transitionLeaveTimeout={this.props.transitionLeaveTimeout ||150}
            
            >
            {React.Children.toArray(this.props.children).filter(c=>!!c).map((c,i) => React.cloneElement(c as any, { key: i })) }
        </ReactCSSTransitionGroup>;
    }
}