import * as React from 'react'
import { EntityEditor } from "../SF/components/webapi/EntityEditor";
import * as Page from "../SF/webadmin/components/Page"

export default class SigninPage extends React.Component<any> {
    constructor(props: any) {
        super(props);
    }
    render() {
        var p = this.props;
        var id=p.match.params.id;
        return <Page.Container>
            <Page.Header links={[{text:"管理员设置"}]}/>
            <Page.Content>
            <EntityEditor
                    id={id}
                    controller="AdminManager"
                    loadAction="GetSetting"
                    updateAction="SetSetting"
                    disableCreate={true}
                    disableRemove={true}
                />
            </Page.Content>
        </Page.Container>
    }
}