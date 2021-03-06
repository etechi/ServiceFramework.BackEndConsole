﻿import * as React from 'react';
import * as  ccfg from "../../utils/config";

export interface ImageProps{
    src?:string;
    res?:string;
    format?:string;
    width?:string;
    height?:string;
    className?: string;
    defaultImageSrc?: string;
    defaultImageRes?: string;
}
export class Image extends React.Component<ImageProps, {}>
{
    render() {
        var src = this.props.src ||
            this.props.res && ccfg.res(this.props.res, this.props.format) ||
            this.props.defaultImageSrc ||
            this.props.defaultImageRes && ccfg.res(this.props.defaultImageRes, this.props.format) ||
            null;

        var args:any={}
        if(this.props.width)args.width=this.props.width;
        if(this.props.height)args.height=this.props.height;
        if(this.props.className) args.className=this.props.className;

        return src && <img src={src} {...args} /> || null;
    }
}