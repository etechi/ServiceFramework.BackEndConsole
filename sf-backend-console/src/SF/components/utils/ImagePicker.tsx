﻿import * as React from 'react'
import assign from '../../utils/assign';
import {Uploader} from "./Uploader";
import {Image} from "./Image";

export interface ImagePickerProps{
    className?: string;
    value?: any;
    onChange?(e: any): void;
    fullWidth?: boolean;
    disabled?: boolean;
    small?: boolean;
}
export class ImagePicker extends React.Component<ImagePickerProps, {}>{
    constructor(props: ImagePickerProps) {
        super(props);
    }
    render() {
        var props = assign(this.props, {}) as any;
        var onChange = props.onChange;
        delete props.className;
        delete props.onChange;
        if(!props.value && props.disabled)
            return <div className="form-control">未指定</div>;
        return <Uploader
            className={`image-picker-control ${this.props.small?"small":this.props.fullWidth ? 'full-width' : ''} ${this.props.className || ''}`}
            onUploaded={(v) => onChange(v) }
            {...this.props }
            >
            {this.props.value ? <a className="btn btn-default" onClick={e => e.stopPropagation() } href={this.props.value.indexOf('/') == -1 ? `/r/${this.props.value}` : this.props.value} target='_blank' >
                <span className="fa fa-search"></span>
            </a> : null}
            {!this.props.value?
            <div className="empty">点击/拖放<br/>上传图片</div>
                : this.props.value.indexOf('/') == -1 ?
                    <Image res={this.props.value} format={this.props.small ? 'c40' : this.props.fullWidth ? null : 'c150'} width={this.props.small?'40':this.props.fullWidth ? '100%' : '150'}/>
            :                
                    <Image src={this.props.value} width={this.props.small ? '40':this.props.fullWidth ? '100%' : '150'}/>
            }
        </Uploader>
    }
}