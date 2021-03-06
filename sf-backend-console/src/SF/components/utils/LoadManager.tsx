﻿import * as React from 'react';
import assign  from "../../utils/assign";
import {Loading} from "./Loading";
import * as  apicall  from "../../utils/apicall";
import * as  wait  from "../../utils/wait";
export enum LoadState {
    Init,
    
    SingleLoading,
    SingleLoaded,
    SingleEmpty,

    ListFirstLoading,
    ListReloadLoading, 
    ListMoreLoading,
    ListNoMoreData,
    ListEmpty,
    ListLoadedWithMoreData
}

export interface LoadManagerProps {
    //state: LoadStatus;
    ClassName?: string;
    onLoad(loadKey?:any,paging?:apicall.IQueryPaging):PromiseLike<any>;
    onDataAvailable(data:any):void;
    disableScrollToLoad?:boolean;
    limit?:number;      //未指定为单项载入
    loadKey?:any;    //key变化时重新加载
    children?: React.ReactNode;
    useWait?: boolean;
}
export interface state{
    state?:LoadState;
    error?:any;
    hasError?:boolean;
    loaded?:number;
    items?:any[];
}

function delay(ms:number){
    return new Promise(r=>setTimeout(r,ms));
}

export class LoadManager extends React.Component<LoadManagerProps, state>
{
    constructor(props:any){
        super(props);
        this.state={state:LoadState.Init};
    }
    assignState(state:state,cb?:()=>void){
        this.setState(assign(this.state,state),cb);
    }
    _load(loadKey?: any, paging?: apicall.IQueryPaging) {
        if (this.props.useWait)
            return wait.start(() => this.props.onLoad(loadKey, paging));
        return this.props.onLoad(loadKey, paging);
            
        //return delay(5000).then(r=>this.props.onLoad(loadKey,paging));
    }
    load(reload?:boolean):any{
        var ls=this.state.state;
        if(ls==LoadState.ListFirstLoading || ls==LoadState.ListMoreLoading || ls==LoadState.SingleLoading || ls==LoadState.ListNoMoreData)
            return;
        if(this.props.limit){
            var loaded=this.state.loaded || 0;
            this.assignState({ hasError:false, state:loaded?LoadState.ListMoreLoading:reload?LoadState.ListReloadLoading:LoadState.ListFirstLoading});
            var loadKey=this.props.loadKey;
            this._load(loadKey,{offset:loaded,limit:this.props.limit}).then(
                (r: any) =>{
                    if(this._unmounted)return;
                    if(loadKey!=this.props.loadKey) return;
                    var curLoaded=r && r.length ||0;
                    var items=loaded?(this.state.items || []).concat(r):r;
                     this.assignState(
                        { 
                            items:items,
                            loaded:loaded+curLoaded,
                            state: curLoaded==0 ? 
                                (loaded? LoadState.ListNoMoreData:LoadState.ListEmpty)  :  
                                this.props.limit>curLoaded?LoadState.ListNoMoreData:LoadState.ListLoadedWithMoreData
                        });
                    this.props.onDataAvailable(items);
                },
                e =>{
                    if(this._unmounted)return;
                    if(loadKey!=this.props.loadKey) return;
                    this.assignState({ hasError:true, error: e });
                 }
                );

        }
        else{
            this.assignState({state: LoadState.SingleLoading,hasError:false });
            var loadKey=this.props.loadKey;
            return this._load(loadKey).then(
                r => {
                    if(this._unmounted)return;
                    if(loadKey!=this.props.loadKey) return;
                    this.assignState({ state: r ? LoadState.SingleLoaded : LoadState.SingleEmpty });
                    this.props.onDataAvailable(r);
                },
                e => {
                    if(this._unmounted)return;
                     if(loadKey!=this.props.loadKey) return;
                    this.assignState({ hasError:true,error: e });
                 }
                );
        }
    }
    handlerRetryLoad() {
        this.load();
    }
    _scroll_handler:EventListener=null;
    installScrollHandler(){
        this._scroll_handler = () => {
            var ls=this.state&& this.state.state;
            if (this.state.hasError || ls==LoadState.ListFirstLoading || ls==LoadState.ListMoreLoading)
                return;
            if (document.body.scrollTop < document.body.scrollHeight - window.innerHeight - 200)
                return;
            this.load();
        };
        window.addEventListener("scroll", this._scroll_handler, false);
    }

    componentDidMount() {
        if(this.props.limit && !this.props.disableScrollToLoad)
            this.installScrollHandler(); 
        this.load(); 
        //this.timer = window.setInterval(() => this.handler(null), 100);
    }   
    _unmounted=false;
    componentWillUnmount() {
        this._unmounted=true;
        if(this._scroll_handler)
        {
            window.removeEventListener("scroll", this._scroll_handler, false);
            this._scroll_handler=null;
        }
    }
    reload(){
        this.setState({items:null,loaded:0,state:LoadState.Init});
         this.load(true);
    }

    componentWillReceiveProps(nextProps: LoadManagerProps, nextContext: any): void{
        if(nextProps.loadKey!=this.props.loadKey)
            setTimeout(()=>this.reload(),10);
    }

    render() {
        var s = this.state;
        if (s == null)
            return null;
        var ls=s.state;


        if(s.error){
            if(ls==LoadState.ListMoreLoading){
                return <div onClick={()=>this.handlerRetryLoad()} className={`load-manager load-more-error ${this.props.ClassName}`}><span className="fa fa-exclamation "></span> 发生网络故障，点击刷新</div>
            }
            else{
                return <div onClick={() =>this.handlerRetryLoad()} className={`load-manager error ${this.props.ClassName}`}><span className="fa fa-exclamation big"></span> 发生网络故障，点击刷新</div>
            }
        }

        switch (s.state) {
            case LoadState.SingleLoading:
            case LoadState.ListFirstLoading:
                return <div className={`load-manager loading ${this.props.ClassName}`}>
                    <div>
                        <Loading  />
                    </div>
                </div>
            case LoadState.ListReloadLoading:
                return <div className={`load-manager reloading ${this.props.ClassName}`}>
                    <div>
                        <Loading />
                    </div>
                </div>
            case LoadState.ListMoreLoading:
            return <div className={`load-manager list-more-loading ${this.props.ClassName}`}>
                    <span className="fa-spin fa fa-cog"></span> 正在加载...
                </div>
            case LoadState.SingleEmpty:
            case LoadState.ListEmpty:
                return <div className= {`load-manager empty ${this.props.ClassName}`}><span className="fa fa-info big"></span> {this.props.children || "没有内容"}</div>
            case LoadState.ListLoadedWithMoreData:
                return <div className= {`load-manager has-more-data ${this.props.ClassName}`}><span className="fa fa-info "></span> 下拉继续加载</div>
            case LoadState.ListNoMoreData:
                return null;
            default:
                return null;
        }
    }
}