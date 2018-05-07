import * as React from 'react';
import {createBrowserHistory} from 'history';
var browserHistory=createBrowserHistory();

import {EntityEditor} from "../../../components/webapi/EntityEditor";
import * as Page from "../Page"
export interface EditViewArgs{
    links: Page.IHeadLink[];
    controller: string;
    serviceId?: number;
    loadAction ?:string;
    createAction ?: string;
    updateAction ?:string;
    readonly?: boolean;
    id?: any;
    jumpback?: boolean;
} 
export default function EditView(args: EditViewArgs) {
    return class EditView extends React.Component<{ match: any }, {}>{
        render() {
            var id = args.id;
            if (!id) {
                id = this.props.match && this.props.match.params && this.props.match.params[0] || null;
            }
            return <Page.Container>
                <Page.Content>
                    <EntityEditor
                        id={id}
                        controller={args.controller}
                        serviceId={args.serviceId}
                        loadAction={args.loadAction}
                        createAction={args.createAction}
                        updateAction={args.updateAction}
                        readonly={args.readonly}
                        onSubmitSuccess={() => {
                            if (args.jumpback)
                                browserHistory.goBack();
                        }}
                        onBuildSubmitPanel={(props, cmds) =>
                            <Page.Header >{/*nav={args.links}*/}
                                {cmds}
                            </Page.Header>
                        }/>
                </Page.Content>
            </Page.Container>
        }
    }
    
}
