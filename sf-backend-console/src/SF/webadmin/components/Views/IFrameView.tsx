﻿import * as React from 'react';
import * as Page from "../Page"
export interface HelpViewArgs {
    links: Page.IHeadLink[];
    src: string;
}
export default function HelpView(args: HelpViewArgs) {
    return class HelpView extends React.Component<{}, {}>{
        render() {
            return <Page.Container>
                <Page.Header >{/*nav={args.links}*/}
                </Page.Header>
                <Page.Content>
                    <div className="iframe-page-content" >
                        <iframe src={args.src}/>
                    </div>
                </Page.Content>
            </Page.Container>
        }
    }
}

