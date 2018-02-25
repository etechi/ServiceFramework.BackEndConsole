import * as React from 'react'
import * as ReactRouter from 'react-router'
import * as apicall from '../../utils/apicall';
import * as Views from '../components/Views';
import * as Page from "../components/Page"

export default class PageHeader extends React.Component<{ title: any, links: any }, { chd: any }> {
    constructor(props: any) {
        super(props);
        this.state = {chd:null};
    }
    setChildContent(child:any) {
        this.setState({ chd: child });
    }
    render() {
        return <Page.Header title={this.props.title} links={this.props.links} >
            {this.state && this.state.chd|| null}
        </Page.Header>
    }
}