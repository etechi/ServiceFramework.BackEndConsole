import * as React from 'react'
import Link from '../../components/utils/Link';
//import ScrollArea from 'react-scrollbar';
//import ScrollArea from 'react-scrollbar';
import Scrollbars  from 'react-custom-scrollbars';

import * as  classnames  from "classnames"; 
import * as lodash from 'lodash';  
import * as PropTypes from 'prop-types'
import { IMenuItem } from '../BackEndConsoleSetting';
export class SearchBox extends React.Component<any, any> {
    render() {
        return <li className="sidebar-search-wrapper">
            <form className="sidebar-search sidebar-search-bordered" action="#" method="POST">
                <a href="javascript:;" className="remove">
                    <i className="icon-close"></i>
                </a>
                <div className="input-group">
                    <input type="text" className="form-control" placeholder="Search..."/>
                    <span className="input-group-btn">
                        <a href="javascript:;" className="btn submit">
                            <i className="icon-magnifier"></i>
                        </a>
                    </span>
                </div>
            </form>
        </li>
    }
}


export interface MenuCategoryProperty {
    icon: string;
    name: string;
    isActive:boolean;
    children?: React.ReactNode;
}

class MenuCategory extends React.Component<MenuCategoryProperty> {
    constructor(props: MenuCategoryProperty) {
        super(props);
    }
    static contextTypes = {
      
        openedCategory: PropTypes.object,
        openCategory: PropTypes.func.isRequired
    };
    
    render() {
        const ctx = this.context as any;
        const open = ctx && ctx.openCategory || ((x: any) => { });
        var is_active=this.props.isActive || false;
        const is_open = ctx && ctx.openedCategory == this || !ctx.openedCategory && is_active;
        var selected = is_active ? <span className="selected" /> : null;
        return <li
            className={classnames("nav-item", { active: is_active, open: is_open }) }
            onClick={() => open(this) }
            >
            <a href="javascript:;" className="nav-link nav-toggle">
                <i className={this.props.icon || "fa fa-wrench"}></i>
                <span className="title">{this.props.name}</span>
                <span className={classnames("arrow", { open: is_open }) } ></span>
                {selected}
            </a>
            <ul className="sub-menu" style={{ display: is_open ? 'block' : 'none' }}>
                {this.props.children}
            </ul>
        </li>
    }
}
 
export interface MenuGroupProperty {
    name: string;
    children?: React.ReactNode;
}
export class MenuGroup extends React.Component<MenuGroupProperty, any> {
    render() {
        var cs = React.Children.toArray(this.props.children);
        cs.unshift(<li className="heading" key="groupHead">
            <h3 className="">{this.props.name}</h3>
        </li>);
        return cs;
    }
}

export interface MenuItemProperty {
    icon: string;
    name: string;
    to: string;
    isActive?:boolean;
}


export class MenuItem extends React.Component<MenuItemProperty, any> {

    render() {
        var selected = this.props.isActive ? <span className="selected" /> : null;

        return <li className={classnames({ active: this.props.isActive }) } >
            <Link to={this.props.to} target={this.props.to.indexOf('://')!=-1?'_blank':null}>
                <i className={this.props.icon || "fa fa-wrench"} ></i> {this.props.name}
                {selected}
            </Link>
        </li>
    }
}

export interface ContainerProps {
    children?: React.ReactNode;
    pathPrefix?: string;
    curPath?: string;
    menuGroups?: IMenuItem[];

}
export interface ContainerState {
    openedCategory?: MenuCategory
}
export class Container extends React.Component<ContainerProps, ContainerState> {
    constructor(props: ContainerProps, ctx: any) {
        super(props, ctx);
        this.state = { openedCategory: null };
    }

    getChildContext(): any {
        var cctx: any = this.context;
        return {
            openedCategory: this.state.openedCategory,
            openCategory: (category: MenuCategory) => {
                this.setState({
                    openedCategory: category
                });
            }
        }
    }
    
    render() {
        var chds = this.props.children ? React.Children.toArray(this.props.children) : [];

        const searchbox = chds.filter(i => (i as any).type == SearchBox);
        const children = chds.filter(i => (i as any).type != SearchBox);
        const pathMerge = (prefix:any, base:any, path:any) => {
            if (path.indexOf('://')!=-1)
                return path;
            if (path.charAt(0) == '/')
                return path;
            if (base.charAt(0) == '/')
                return base + "/" + path;
            
            return prefix  + base + "/" + path;
        }
        if (this.props.menuGroups) {
            var pathPrefix = this.props.pathPrefix || "";
            if (!pathPrefix || pathPrefix[pathPrefix.length - 1] != '/')
                pathPrefix += '/';
            
            var curPath = this.props.curPath || "";
            
            curPath = curPath.startsWith(pathPrefix) ? curPath.substr(pathPrefix.length) : "";
            if (curPath[0] != '/') curPath = '/' + curPath;

            this.props.menuGroups.forEach((grp, i1) =>
                children.push(
                    <MenuGroup key={i1} name={grp.Title}>
                        {grp.Children ? grp.Children.map((cat, i2) =>
                            <MenuCategory
                                key={i2}
                                name={cat.Title}
                                icon={cat.FontIcon}
                                isActive={cat.Children?cat.Children.filter(c => curPath.startsWith(c.Link)).length>0:false}
                            >
                                {cat.Children ? cat.Children.map((item, i3) => 
                                    <MenuItem
                                        key={i3}
                                        name={item.Title}
                                        icon={item.FontIcon}
                                        to={item.Link}
                                        isActive={curPath.startsWith(item.Link)}
                                    />
                                ):null}
                            </MenuCategory>
                        ) : null}
                    </MenuGroup>
                )
                )
            //var idx = 0;
            //lodash(this.props.menuGroups)
            //    .map((c, i) => ({ c: c, i: i }))
            //    .groupBy(i => i.c.group || "")
            //    .values()
            //    .sortBy(c => c[0].i)
            //    .map((c: any[]) => c.map(i => i.c))
            //    .forEach((cs: menu.IMenuCategory[]) => {
            //        if(cs[0].group)
            //            children.push(<MenuGroup key={idx++} name={cs[0].group}/>);
            //        cs.forEach((c) => {
            //            var cp=decodeURIComponent(c.path);
            //            var isCatActived=curPath.startsWith(cp+"/");
            //            var itemPath=isCatActived?curPath.substr(cp.length+1):"";
            //            var i=itemPath.indexOf('/');
            //            if(i!=-1)itemPath=itemPath.substring(0,i);
            //            children.push(
            //                <MenuCategory key={idx++}  name={c.name} icon={c.icon} isActive={isCatActived} >
            //                    {
            //                        c.items.map((i, idx) =>
            //                            <MenuItem key={idx} name={i.name} icon={i.icon} to={pathMerge(pathPrefix,c.path,i.path)} isActive={i.path==itemPath} />
            //                        )
            //                    }
            //                </MenuCategory>
            //            )
            //        });
            //    });
        }
        return <div className="navbar-collapse collapse page-sidebar" style={{ top: "42px", bottom: "0px" }}>
            <Scrollbars style={{ height: "100%" }}>
                <ul className="page-sidebar-menu" data-keep-expanded="false" data-auto-scroll="true" data-slide-speed="200">
                    {searchbox}
                    {children}
                </ul>
            </Scrollbars>
        </div>
    }
}


(Container as any).childContextTypes = {
   
    openedCategory: PropTypes.object,
    openCategory: PropTypes.func
}

