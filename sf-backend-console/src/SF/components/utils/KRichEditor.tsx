﻿import * as React from 'react';
import {upload} from "./Uploader";
import Debouncer from "../../utils/Debouncer";

import {getAccessToken} from "../../utils/apicall"

export interface RichEditorProps{
    disabled?: boolean;
    value?: string;
    onChange?(v: string): void;
    className?: string;
}
interface state{
}
var KindEditor: any = null;
export class RichEditor extends React.Component<RichEditorProps, state>{
    
    constructor(props:any){ 
        super(props);
        if (!KindEditor)
            KindEditor = window["KindEditor"];
        this.state={};
    }
    _editor: any;
    
    componentDidMount() {
        if (this.props.disabled)
            return;
        //KindEditor.ready((K) => {
        this._editor = KindEditor.create(this.refs["textarea"], {
            themesPath:"/admin/vender/kindeditor/themes/default/default.png",
            syncType: "",
            width: "100%",
            height: "300px",
            afterChange: () => this.changeHandler(),
            items: [
                'source', '|', 'undo', 'redo', '|',  'cut', 'copy', 'paste',
                'plainpaste', 'wordpaste', '|', 'justifyleft', 'justifycenter', 'justifyright',
                'justifyfull', 'insertorderedlist', 'insertunorderedlist', 'indent', 'outdent', 'subscript',
                'superscript', 'clearhtml', 'quickformat', 'selectall', '|', 'fullscreen', '/',
                'formatblock', 'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold',
                'italic', 'underline', 'strikethrough', 'lineheight', 'removeformat', '|', 'image',
                'insertfile', 'table', 'hr',  'baidumap',
                'anchor', 'link', 'unlink'
            ],
            uploadJson:"/api/media/upload?returnJson=true&access-token="+encodeURIComponent(getAccessToken())
            });
        this._editor.html(this.props.value);
        this._curHtml = this.props.value;

        //});
    }
    _debouncer = new Debouncer();
    _curHtml: string = null;
    changeHandler() {
        this._debouncer.exec(() => {
            var html = this._editor.html();
            if (html != this.props.value) {
                this._curHtml = html;
                this.props.onChange(html);
            }
        }, 1000);
    }
    componentWillReceiveProps(nextProps: RichEditorProps, nextContext: any): void {
        if (this._curHtml == nextProps.value)
            return;
        this._curHtml = nextProps.value;
        this._editor.html(nextProps.value);
    }
    shouldComponentUpdate(nextProps: RichEditorProps, nextState: state, nextContext: any): boolean
    {
        return false;
    }
    componentWillUnmount() {
        this._debouncer.dispose();
        if (this._editor)
            this._editor.remove();
    }
    render() {
        if (this.props.disabled)
            return <div className="rich-editor readonly" dangerouslySetInnerHTML={{ __html: this.props.value }}></div>
        return <div className="rich-editor">
            <textarea ref="textarea" ></textarea>
            <div className="alert alert-info">复杂文档建议直接使用整张大图来避免排版问题。</div>
        </div>;
    }

}
