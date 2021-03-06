﻿import * as React from 'react' 
import * as Header from './Header'
import * as SideBar from './SideBar'
import QuickSideBar from './QuickSideBar'
import PageSpinner from './PageSpinner'
import Footer from './Footer'
import {WaitCover} from "../../components/utils/WaitCover";
import {ModalContainer} from "../../components/utils/Modal";
import * as PropTypes from 'prop-types';
export interface ApplicationProperty {
    children?:React.ReactNode;
}


class Application extends React.Component<ApplicationProperty, any>{
    constructor(props: ApplicationProperty) {
        super(props);
    }
    static contextTypes = {
        router: PropTypes.object.isRequired
    };
    
    

    render() {
        var header =React.Children.toArray(this.props.children).filter(i =>i && (i as any).type == Header.Container);
        var sidebar = React.Children.toArray(this.props.children).filter(i => i && (i as any).type == SideBar.Container);
        var quicksidebar = React.Children.toArray(this.props.children).filter(i => i &&(i as any).type == QuickSideBar);
        var footer = React.Children.toArray(this.props.children).filter(i => i &&(i as any).type == Footer);
        var views = React.Children.toArray(this.props.children).filter(i => i &&(i as any).type != Footer && (i as any).type != Header.Container && (i as any).type != SideBar.Container && (i as any).type != QuickSideBar);

        return <div>
            <PageSpinner visible={false} />

            <div className="page-header navbar navbar-fixed-top">
                {header}
            </div>
            <div className="clearfix"> </div>
            <div className="page-container">
                <div className="page-sidebar-wrapper" style={{ height: "100%" }}>
                    {sidebar}
                </div>

                <div className="page-content-wrapper">
                    <div className="page-content">
                        <div className="fade-in-up">{views}</div>
                    </div>
                </div>
                <a href="javascript:;" className="page-quick-sidebar-toggler">
                    <i className="icon-login"></i>
                </a>
                <div className="page-quick-sidebar-wrapper">
                    {quicksidebar}
                </div>
            </div>
            <div className="page-footer">
                {footer}
                <div className="scroll-to-top">
                    <i className="icon-arrow-up"></i>
                </div>
            </div>
            <WaitCover/>
            <ModalContainer/>
       </div>
    }
}

export default Application;