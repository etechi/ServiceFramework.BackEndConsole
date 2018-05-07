import * as React from 'react';
import * as Page from "../Page"
import {HelpContainer} from "../../../components/utils/HelpContainer";
export interface HelpViewArgs {
    links: Page.IHeadLink[];
    help: string;
}
export default function HelpView(args: HelpViewArgs) {
    return class HelpView extends React.Component<{}, {}>{
        render() {
            return <Page.Container>
                <Page.Header >{/*nav={args.links}*/}
                </Page.Header>
                <Page.Content>
                    <HelpContainer html={args.help}/>
                </Page.Content>
            </Page.Container>
        }
    }
}

