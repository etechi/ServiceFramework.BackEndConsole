﻿import * as React from 'react'

let ViewPanel = (props: { name: string, children?: React.ReactNode; }) =>
    <div>{props.children}</div>;
export default ViewPanel;