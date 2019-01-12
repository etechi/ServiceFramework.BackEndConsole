import * as React from 'react'
import { Link } from 'react-router-dom'

export interface IHeadLink {
    dom?:React.ReactNode;
    to?: string;
    text: string;
    active?:boolean;
    replace?:boolean;
    primary?:boolean;
    desc?:string;
    onClick?():void;
}
export interface IHeaderProps {
    title?: string;
    nav?: IHeadLink[];
    children?: React.ReactNode;
}
export class Header extends React.Component<IHeaderProps, any>{
    render() {
        return <div className="page-bar">
            {this.props.title ? <label style={{ float: 'left', margin: "10px 10px 0 0", fontSize: "16px", fontFamily: "微软雅黑" }}>{this.props.title}</label> : null}
            {/* <ul className="page-breadcrumb">
                {
                    this.props.links && this.props.links.map((hl, idx) =>
                        <li key={idx}>
                            {hl.to ? <Link to={hl.to}>{hl.text}</Link> : hl.text}
                            {idx == this.props.links.length - 1 ? null:<i className="fa fa-circle"></i>}
                        </li>
                    ) || null
                }
            </ul> */}
            <div className="tabbable-line" style={{float:"left",margin:"5px 0 0 16px"}}>
                <div className="nav nav-tabs">
                    
                    {
                        (()=>{
                            var nav:any=this.props.nav?this.props.nav.filter(n=>!!n.to).map((n,i)=>
                                <li className={n.active?"active":""}><Link key={i} className="btn btn-xs table-action" replace={n.replace} title={n.desc} to={n.to}>{n.text}</Link></li>
                            ):[];
                            if(!(nav.length>8))
                                return nav;

                            return [
                                nav.slice(0,8),
                                <li ref="drop" className={"dropdown "+(this.state && this.state.moreLinks && "open" || "")} 
                                    onMouseOut={(e)=>{
                                        if(!this.refs.drop)return;
                                        var rt=e.relatedTarget as any;
                                        while(rt)
                                        {
                                            if(rt==this.refs.drop)
                                                return;
                                            rt=rt.parentNode;
                                        }
                                        this.setState({moreLinks:false});
                                        
                                        }}>
                                    <a onMouseOver={()=>{this.setState({moreLinks:true})}}>更多</a>
                                    <ul className= "dropdown-menu" >
                                    {nav.slice(8)}
                                    </ul>
                                </li>
                            ];

                        })()
                    }

                </div>
            </div>
            <div className="page-toolbar">
                  {this.props.children}
            </div>
        </div>
    }
}

export class Content extends React.Component<{ children?: React.ReactNode; }, any>{
    render() {
        return <div>{this.props.children}</div>;
    }
}
export interface IContainerProps {
    name?: string;
    style?: any;
    children?: React.ReactNode;
}
export class Container extends React.Component<IContainerProps, any> {
    constructor(props: IContainerProps) {
        super(props)
    }
    render() {
        var children = React.Children.toArray(this.props.children);
        var header = children.filter(i => (i as any).type == Header);
        if (header.length == 0) header = [children[0]];
        var content = children.filter(i => (i as any).type == Content);
        return <div className="page-wrapper" style={this.props.style} >
            {header}
            {this.props.name ? < h3 className="page-title">{this.props.name}</h3> : null}
            {content}
        </div>
    }
}

