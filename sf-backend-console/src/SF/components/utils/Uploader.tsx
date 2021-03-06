﻿import * as React from 'react';
import * as apicall from '../../utils/apicall'
export interface file{
    file:any;
    imageUrl:string;
}
export interface UploaderProps{
    disabled?: boolean;
    onUploaded(result:any):void;
    //onPreview(file:file):void;
    className?:string;
    multiple?:boolean;
    accept?:string;
    uploadUri?:string
}
interface state{
    isDragActive?:boolean;
}
export function upload(file: any, url?: string ) {
    if (!url) url = "/api/media/upload";
    return new Promise<string>((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        var fd = new FormData();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Authorization","Bearer "+apicall.getAccessToken());
        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4)
                return;
            if (xhr.status != 200) {
                reject({ _error:"上传失败" });
                return;
            }
            var type = xhr.responseType || xhr.getResponseHeader("Content-Type");
            var data = type == "application/json" || type == "text/json" ? JSON.parse(xhr.responseText) : xhr.responseText;
            resolve(data);
        };
        fd.append("file", file);
        xhr.send(fd);
    });
}

export class Uploader extends React.Component<UploaderProps,state>{
    constructor(props:any){ 
        super(props);
        this.state={isDragActive: false};
    } 

    onDragLeave(e: React.DragEvent<Element>) {
    this.setState({isDragActive: false});
  }
    onDragOver(e: React.DragEvent<Element>) {
      e.preventDefault();
      if (this.props.disabled)
          return;

    e.dataTransfer.dropEffect = 'copy';
    this.setState({isDragActive: true});
  }
  uploadFile(file) {
      upload(file, this.props.uploadUri).then(r => this.props.onUploaded(r));
  }
  onDrop(e: React.DragEvent<Element>) {
    e.preventDefault();
    if (this.props.disabled)
        return;
    this.setState({isDragActive: false});
    var files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = (e.target as any).files;
    }
    for(var i=0;i<files.length;i++)
        this.uploadFile(files[i]);
  }

  onClick() {
      if (this.props.disabled) return;
       (this.refs["fileInput"] as any).click();
  }

  render() {
  
    var inputArgs={
        style:{display:'none'},
        type:"file",
        onChange:(e)=>{this.onDrop(e)},
        accept:this.props.accept,
        multiple:this.props.multiple || false
    };
    return <div
        className={`uploader ${this.state.isDragActive || 'active'} ${this.props.className || ''} ${this.props.disabled?'disabled':''}`}
        onClick={()=>this.onClick()} 
        onDragLeave={e=>this.onDragLeave(e)} 
        onDragOver={e=>this.onDragOver(e)} 
        onDrop={e=>this.onDrop(e)}
        style={{cursor:"pointer"}}
        >
        <input ref='fileInput' {...inputArgs}/>
        {this.props.children}
      </div>
  }

}
