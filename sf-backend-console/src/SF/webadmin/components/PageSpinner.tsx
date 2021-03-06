﻿import * as React from 'react'
let PageSpinner = (props?: { visible?: boolean }) =>
    props && props.visible?<div className="page-spinner-bar">
        <div className="bounce1"></div>
        <div className="bounce2"></div>
        <div className="bounce3"></div>
    </div>:null

export default PageSpinner
