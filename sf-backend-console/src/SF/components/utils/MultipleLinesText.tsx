﻿import * as React from 'react';

export default function MultipleLinesText(props: { text: string,className?:string }){
    const {text,className} = props;
    return <div className={`multi-lines-text ${className || ''}`}>{(text || "").split('\n').map((t, i) => <div key={i}>{t}</div>) }</div>;
}