﻿import * as React from 'react';
import * as  wait  from "../../utils/wait";
//import {FadeIn} from "./FadeIn";
import { Loading } from "./Loading";
declare var require: any;
var ReactCSSTransitionGroup = require('react-addons-css-transition-group');

interface state {
    waiting?: boolean;
    visible?: boolean;
    error?: string;
    hide?: () => void;
    retry?: () => void;
}
export class WaitCover extends React.Component<{}, state> implements wait.IWaitCover {
    constructor(props: any) {
        super(props);
        this.state = {};
    }
    componentDidMount() {
        wait.setup(this);
    }
    componentWillUnmount() {
        wait.setup(null);
    }
    start(): void { 
        this.setState({ waiting: true });
    }
    show(): void {
        this.setState({ visible: true, hide: null, error: null });
    }
    error(e: any, hide: () => void, retry?: () => void): void {
        this.setState({ hide: hide, retry: retry, error: e });
    }
    hide(): void {
        this.setState({ waiting: false, hide: null, retry: null, visible: false, error: null });
    }
    render() {
        var s = this.state;
        //if(!s || !s.waiting)return null;
        //<div id="wait-cover" onClick={this.state.hide}>
        var overlap = s.waiting && <div className="overlap"></div> || null;
        var cover = s.waiting && s.visible && <div key="cover" className="cover"></div> || null;
        var waiting = s.waiting && s.visible && !s.error && <div key="waiting" className="waiting"><Loading delay={0}/><span>正在请求服务器，请稍后...</span></div> || null;
        var error = s.waiting && s.visible && s.error && <div key="error" className="error">
            <span className="fa fa-ban"></span>
            <p>{s.error}</p>
            {s.retry && <button onClick={(e) => { e.stopPropagation(); s.retry(); } }>重试</button> || null}
        </div> || null;

        return <div id="wait-cover" >
            {overlap}
            <ReactCSSTransitionGroup
                transitionName="wait-cover-ani"
                transitionEnterTimeout={1000}
                transitionLeaveTimeout={1000}
                onClick={s.hide}
                >
                {cover}
                {waiting}
                {error}
            </ReactCSSTransitionGroup>
            <img src="/Content/mobile/images/waiting-bg.png" style={{ width: "1px", height: "1px", position: "absolute", top: "-100px", left: "0px" }} />
        </div>
    }
}