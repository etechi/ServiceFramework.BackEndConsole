import * as React from 'react'
import * as ReactRouter from 'react-router'
import * as apicall from '../../utils/apicall';
import * as Views from '../components/Views';
import * as Page from "../components/Page"
import { Link } from 'react-router-dom'

export interface IPageHeadAction{
    dest?:string;
    text:string;
    to?:string;
    onclick?():void;
}

export default class PageHeader extends React.Component<{ title: any}, { actions?: Page.IHeadLink[], nav?: Page.IHeadLink[] }> {
    constructor(props: any) {
        super(props);
        this.state = {actions:null,nav:null};
    }
    setChildContent(actions: Page.IHeadLink[],nav: Page.IHeadLink[]) {
        this.setState({ actions: actions,nav:nav });
    }
    render() {
        return <Page.Header title={this.props.title} nav={this.state && this.state.nav || null} >
            {this.state && this.state.actions?this.state.actions.map((n,i)=>
                n.dom?n.dom:
                n.to?<Link key={i} className={"btn btn-"+(n.primary?"primary":"default")} replace={n.replace} title={n.desc} to={n.to}>{n.text}</Link>:
                n.onClick?<button key={i} className="btn btn-default " title={n.desc} onClick={n.onClick}>{n.text}</button>:
                null
            ):null}
        </Page.Header>
    }
}