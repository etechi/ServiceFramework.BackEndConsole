import * as React from 'react'
import * as ReactRouter from 'react-router'
import * as apicall from '../../utils/apicall';
import * as Views from '../components/Views';
import * as Page from "../components/Page"

export default class PageHeader extends React.Component<{ title: any}, { actions?: React.ReactNode, nav?: React.ReactNode }> {
    constructor(props: any) {
        super(props);
        this.state = {actions:null,nav:null};
    }
    setChildContent(actions:any,nav:any) {
        this.setState({ actions: actions,nav:nav });
    }
    render() {
        return <Page.Header title={this.props.title} nav={this.state && this.state.nav || null} >
            {this.state && this.state.actions|| null}
        </Page.Header>
    }
}