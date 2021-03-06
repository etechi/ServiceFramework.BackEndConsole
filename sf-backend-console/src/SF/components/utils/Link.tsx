﻿import * as React from 'react'
import { Link} from 'react-router-dom'

export interface IExternalLinkDetector {
    (url: string): boolean;
}

var extLinkDetector: IExternalLinkDetector = null;

export function setExtLinkDetector(eld: IExternalLinkDetector) {
    extLinkDetector = eld;
}

let RLink = (props: any) => {
    if (!(extLinkDetector && extLinkDetector(props.to)) && props.to.indexOf('://') == -1)
        return <Link to={props.to} {...props} >{props.children}</Link>
    else
        return <a href={props.to} {...props} onClick={e => e.stopPropagation()} > { props.children }</a>
}

export default RLink;   