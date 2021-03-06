﻿import * as React from 'react'
import  assign  from "../../utils/assign";
//import * as  RForm from "redux-form"; 
import * as FI from "./FormItem";
import * as Editors from "../editors";
export interface TreeNodeConfig {
    type: string;
    contentBuilder: FI.FormRender;
    childProp: string;
    idProp: string;
}

export interface TreeEditorProps {
    className?: string;
    value: any[];
    meta?: Editors.MetaData;
    onChange(e: Editors.ChangeEvent): void;
    nodeConfigs: TreeNodeConfig[];
    readonly?: boolean;
    title?: string;
    renderContext?: FI.IRenderContext;
}
export interface state {
    activePath: any[];
}

export interface IPathNode {
    text: string;
    path: any[];
    value: any;
    meta: Editors.MetaData;
    index: number;
}
export class TreeEditor extends React.Component<TreeEditorProps, state>
{
    constructor(props: TreeEditorProps) {
        super(props);
        var first = props.value && props.value[0];
        this.state = { activePath: first?[0]:[]};
    }
    componentWillReceiveProps(nextProps: TreeEditorProps, nextContext: any) {
        if (!this.state.activePath.length && nextProps.value && nextProps.value.length)
            this.setState({ activePath: [0] });
    }

    handleSelect(path: any[]) {
        var np = [];
        while (path) {
            np.push(path[1]);
            path = path[0];
        }
        np.reverse();
        this.setState({ activePath: np});
    }
    notifyChange(e: Editors.ChangeEvent, nodePath: IPathNode[], level: number) {
        if (level > 0) {
            var nodeIndex = nodePath[level - 1].index;
            var cfgs = this.props.nodeConfigs;
            for (var i = level - 2; i >= 0; i--) {
                var node = nodePath[i];
                var cfg = cfgs[i];
                var chdValues = node.value[cfg.childProp];
                var chdMeta = node.meta && node.meta.child(cfg.childProp) || null;
                e = e.newArrayUpperEvent(
                    nodeIndex,
                    chdValues,
                    chdMeta
                );
                e = e.newObjectUpperEvent(
                    cfg.childProp,
                    node.value,
                    node.meta
                );
                nodeIndex = node.index;
            }
            e = e.newArrayUpperEvent(
                nodeIndex,
                this.props.value,
                this.props.meta
            );
        }
        this.props.onChange(e);
    }
    notifyArrayChange(e: Editors.ChangeEvent, nodePath: IPathNode[], level: number) {
        if (level > 1) {
            e = e.newObjectUpperEvent(
                this.props.nodeConfigs[level-2].childProp,
                nodePath[level-2].value,
                nodePath[level-2].meta
            );
        }
        this.notifyChange(e, nodePath, level-1);
    }
    getPathInfo(nodePath: IPathNode[]) {
        var level = nodePath.length;
        var node = level < 2 ? null : nodePath[level - 2];
        var key = level < 2 ? null : this.props.nodeConfigs[level - 2].childProp;
        var pntItems = node ? node.value && node.value[key] || [] : this.props.value;
        var pntMeta = node ? node.meta && node.meta.child(key) || null : this.props.meta;
        var index = nodePath[level - 1].index;
        return {
            level,
            pntItems,
            pntMeta,
            index
        }
    }
    handleInsert(nodePath: IPathNode[], index: number) {
        if (nodePath.length == 0)
            return;
        var info = this.getPathInfo(nodePath);
        var e=Editors.ChangeEvent.newArraySpliceEvent(
            info.pntItems,
            info.pntMeta,
            index,
            0,
            [{}]
        );
        
        var path = this.state.activePath.slice();
        path[path.length - 1] = index;
        this.setState({ activePath: path });

        this.notifyArrayChange(e, nodePath, info.level);
    }
    handleInsertChild(nodePath: IPathNode[]) {
        var level = nodePath.length;
        var node = nodePath[level - 1];
        var key = this.props.nodeConfigs[level - 1].childProp;
        var pntItems = node.value && node.value[key] || [];
        var pntMeta = node.meta && node.meta.child(key) || null;
        var index = pntItems.length;

        var e = Editors.ChangeEvent.newArraySpliceEvent(
            pntItems,
            pntMeta,
            index,
            0,
            [{}]
        );

        var path = (this.state.activePath || []).slice();
        path.push(index);
        this.setState({ activePath: path });

        this.notifyArrayChange(e, nodePath, nodePath.length + 1);

   }
    handleInsertRootChild() {
        var len = this.props.value && this.props.value.length;
        this.setState({ activePath: [len] });
        var e = Editors.ChangeEvent.newArraySpliceEvent(
            this.props.value,
            this.props.meta,
            len,
            0,
            [{}]
        );
        this.props.onChange(e);
    }
    handleMove(nodePath: IPathNode[], index: number) {
        var path = this.state.activePath.slice();
        path[path.length - 1] = index < path[path.length - 1] ? index : index - 1;
        this.setState({ activePath: path });

        var info = this.getPathInfo(nodePath);

        var e=Editors.ChangeEvent.newArrayMoveEvent(
            info.pntItems,
            info.pntMeta,
            info.index,
            1,
            index
            );

        this.notifyArrayChange(e, nodePath, info.level);
    }
    handleRemove(nodePath: IPathNode[]) {
        var info = this.getPathInfo(nodePath);

        var e = Editors.ChangeEvent.newArraySpliceEvent(
            info.pntItems,
            info.pntMeta,
            info.index,
            1,
            []
        );

        this.notifyArrayChange(e, nodePath, info.level);

        var path = (this.state.activePath || []).slice();
        var curIndex = path[path.length - 1];
        var newlength = info.pntItems.length - 1;
        if (newlength > curIndex)
            return;
        if (newlength>0)
            path[path.length - 1] = newlength - 1;
        else
            path.pop();
        this.setState({ activePath: path });
    }
    render() {
        var p = this.props;
        var cfgs = p.nodeConfigs;
        var activePath = this.state.activePath;
        
        var nodePath: IPathNode[]= [];


        var build_nodes = (matched: boolean, path: any, chds: any, meta: Editors.MetaData, level: number) => 
            <ul>
                {chds?chds.map((child, index) => {
                    var textField = child.Name  ||
                        child.name  ||
                        child.Title ||
                        child.title ||
                        child.Title1 ||
                        child.title1 ||
                        child.Ident||
                        child.ident 
                    var text = textField || `第${index + 1}项`;
                    var cpath = [path, index];
                    var chdMeta = meta && meta.child(index) || null;

                    if (matched && index == activePath[level]) {
                        nodePath.push({
                            text: text,
                            path: cpath,
                            value: child,
                            meta: chdMeta,
                            index:index,
                        });
                    }

                    var ckey = cfgs[level].childProp
                    var isActive = matched && index == activePath[level] && level == activePath.length - 1;
                    var children = ckey ? build_nodes(
                        matched && index == activePath[level],
                        cpath,
                        child[ckey],
                        chdMeta && chdMeta.child(ckey) || null,
                        level + 1
                    ) : null;
                    return <li key={index} className={isActive ? 'active' : ''}>
                        <label onClick={() => this.handleSelect(cpath) }>{text}</label>
                        {children}
                    </li>
                    }):null}
            </ul>

        var nodes = build_nodes(
            true,
            null,
            p.value,
            p.meta,
            0
        );

        var last = nodePath[nodePath.length - 1];
        var curChild = last && last.value || null;
        var curMeta = last && last.meta || null;
        var curChildIndex = last && last.index || 0;
        var curChildParents: any = nodePath.length > 1 ? nodePath[nodePath.length - 2].value[cfgs[nodePath.length - 2].childProp] : p.value;
        var rcPath = [this.props.value || []];
        for (var i = 0, l = nodePath.length - 1; i < l; i++) {
            var node = nodePath[i];
            rcPath.push(node.value);
            rcPath.push(node.value[cfgs[i].childProp]);
        }
        var content = curChild ? cfgs[activePath.length - 1].contentBuilder({
            value: curChild,
            meta: curMeta,
            onChange: (e: Editors.ChangeEvent) => 
                this.notifyChange(e, nodePath, nodePath.length)
        },
        this.props.renderContext ?
            FI.renderContextPushPath(this.props.renderContext, this.props.value) :
            { path: rcPath, lib: null, renderProvider:null }
        ) : null;

        var nav = nodePath.map((p, idx) =>
            <button key={idx} type="button" className="btn btn-link" onClick={() => this.handleSelect(p.path) }><span className="fa fa-angle-right"></span> {p.text}</button>
        );

        var actions = p.readonly ? null : curChild ?
            <div className="actions">
                <div className="btn-group btn-group-sm">
                    <button className="btn btn-default" type="button" disabled={curChildIndex === 0} onClick={() => this.handleMove(nodePath, curChildIndex-1)}><span className="fa fa-angle-up"></span></button>
                    <button className="btn btn-default" type="button" disabled={curChildIndex === curChildParents.length - 1} onClick={() => this.handleMove(nodePath, curChildIndex + 2) }><span className="fa fa-angle-down"></span></button>
                    <button className="btn btn-default" type="button" onClick={() => this.handleRemove(nodePath) }><span className="fa fa-remove"></span> 删除</button>
                </div>
                <div className="btn-group btn-group-sm">
                    <button className="btn btn-default" type="button" onClick={() => this.handleInsert(nodePath, curChildIndex) }>在上面插入</button>
                    <button className="btn btn-default" type="button" onClick={() => this.handleInsert(nodePath, curChildIndex + 1) }>在下面插入</button>
                    <button className="btn btn-default" type="button" disabled={activePath.length >= cfgs.length} onClick={() => this.handleInsertChild(nodePath) }>添加子项</button>
                </div>
            </div> :
            <div className="actions">
                <button className="btn btn-default btn-xs" type="button" onClick={() => this.handleInsertRootChild()}><span className="fa fa-plus"></span> {`添加子项`}</button>
            </div>;
        return <div className={`form-tree-editor clearfix ${p.className || ''}`}>
            <div className="title">
                {actions}
                <button className="btn btn-link" onClick={() => this.handleSelect(null) } ><b>{p.title}</b></button> {nav}
            </div>
            <div className="tree-nodes">{nodes}</div>
            <div className="tree-content"><div>{content}</div></div>
        </div>
    }
}