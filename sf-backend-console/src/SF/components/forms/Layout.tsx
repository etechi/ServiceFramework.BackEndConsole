﻿import * as React from 'react'
import  assign  from "../../utils/assign";
//import * as  lodash  from "lodash";

import * as FI  from "./FormItem";
import * as Editors from "../editors";

export enum BlockType {
    FormItem,
    HBox,
    VBox
}
export interface ItemSetRender {
    (fields: { [index: string]:Editors.IFieldEditorProps}, renderContext: any): JSX.Element;
}

export interface ItemBuilder {
    (index: number, item: FI.FormItem): ItemSetRender
}

export abstract class Block {
    type: BlockType;
    abstract build(ctx: any, idx: number, build: ItemBuilder): ItemSetRender;
}
export class FieldBlock extends Block {
    item: FI.FormItem;
    constructor(item: FI.FormItem) {
        super();
        this.item = item;
        this.type = BlockType.FormItem;
    }
    build(ctx: any, idx: number, build: ItemBuilder): ItemSetRender {
        return build(idx, this.item);
    }
}
export class CombinedBlock extends Block {
    blocks: Block[];
    constructor(hert: boolean, blocks: Block[]) {
        super();
        this.blocks = blocks;
        this.type = hert ? BlockType.HBox : BlockType.VBox;
    }
    build(ctx: any, idx: number, build: ItemBuilder): ItemSetRender {
        var builds = this.blocks.map((b, idx) => b.build(ctx, idx, build)).filter(b=>!!b);
        var className = this.type == BlockType.HBox ? 'hbox clearfix' : 'vbox';

        return (fields, renderContext) => {
            var children = builds.map(b => b(fields, renderContext));
            return <div key={idx} className={className} >{children}</div>
        }
    }
}
//function sortItemsWithLayout(items: FI.FormItem[], level: number) {
//    var len = items.length;
//    for (var i = 0; i < len - 1; i++) {
//        for (var k = i+1; k < len; k++){
//            var c = items[k];
//            if (!c.position || c.position.length <= level)
//                continue;
//            var cp = c.position[level];
//            for (var ti = i; ti >= 0; ti--) {
//                var ii = items[ti];
//                if (ii.position && ii.position.length > level || ii.position[level] < cp)
//                    break;
//            }

//        }
//    }
//}
//function fillItemsLayout(items: FI.FormItem[], level: number) {
//    var offset = 0;
//    var next_idx = 1;
//    var org_last_layouted_position = 0;
//    var last_layouted_position = 0;
//    var last_position = 0;
//    var last_item: FI.FormItem = null;
//    items.forEach(it => {
//        if (!it.position) it.position = [];
//        while (it.position.length <= level) it.position.push(0);
//        if (it.position[level] > 0) {
//            if (it.position[level] < org_last_layouted_position) {
//                org_last_layouted_position = it.position[level];
//                offset = 0;
//            }
//            else {
//                org_last_layouted_position = it.position[level];
//                offset += next_idx - last_layouted_position - 1;
//                it.position[level] += offset;
//            }
//            last_layouted_position = it.position[level];
//            next_idx = last_layouted_position + 1;
//            return;
//        }

//        if (it.position.length > level + 1 && last_item &&
//            it.position[level + 1] === last_item.position[level + 1] + 1) {
//            it.position[level] = last_position;
//            return;
//        }

//        last_item = it;
//        it.position[level] = last_position = next_idx++;
//    });
//}



export function parseLayoutInternal(items: FI.FormItem[], hert: boolean, level: number): Block {
    if (items.length == 1)
        return new FieldBlock(items[0]);


    //console.log(items.map(it => it.position.join(",")).join("\n"));
    var gs:any = {};
    items.forEach(p=>{
        var k=p.position && level < p.position.length ? p.position[level] : 0;
        var g=gs[k];
        if(g)
            g.push(p);
        else
            gs[k]=[p];
        });
    var grps = [] as { order: number; props: FI.FormItem[] }[];
    for (var k in gs)
        grps.push({ order: parseInt(k), props: gs[k] });
    grps.sort((x, y) => x.order - y.order);

    return new CombinedBlock(
        hert,
        grps.map(g => parseLayoutInternal(g.props, !hert, level + 1))
    );
}
//function fillItemsLayout(items: FI.FormItem[], level: number) {
//    var offset = 0;
//    var next_idx = 1;
//    var org_last_layouted_position = 0;
//    var last_layouted_position = 0;
//    var last_position = 0;
//    var last_item: FI.FormItem = null;
//    items.forEach(it => {
//        if (!it.position) it.position = [];
//        while (it.position.length <= level) it.position.push(0);
//        if (it.position[level] > 0) {
//            if (it.position[level] < org_last_layouted_position) {
//                org_last_layouted_position = it.position[level];
//                offset = 0;
//            }
//            else {
//                org_last_layouted_position = it.position[level];
//                offset += next_idx - last_layouted_position - 1;
//                it.position[level] += offset;
//            }
//            last_layouted_position = it.position[level];
//            next_idx = last_layouted_position + 1;
//            return;
//        }

//        if (it.position.length > level + 1 && last_item &&
//            it.position[level + 1] === last_item.position[level + 1] + 1) {
//            it.position[level] = last_position;
//            return;
//        }

//        last_item = it;
//        it.position[level] = last_position = next_idx++;
//    });
//}

export function sort(items: FI.FormItem[]) {
    var curPoss = [0];
    var isZeroPoss = [false];
    items.forEach(i => {
        if (!i.position) i.position = [];
        if (!i.position.length) i.position.push(null);
        for (var k = 0; k < i.position.length; k++) {
            if (i.position[k] === null) {
                i.position[k] = curPoss[k] = (curPoss[k] || 0) + 0.001;
                isZeroPoss[k] = false;
            }
            else if (i.position[k] === 0) {
                if (isZeroPoss[k])
                    i.position[k] = curPoss[k];
                else {
                    i.position[k] = curPoss[k] = (curPoss[k] || 0) + 0.001;
                    isZeroPoss[k] = true;
                }
            }
            else {
                curPoss[k] = i.position[k];
                isZeroPoss[k] = false;
            }
        }
        while (curPoss.length > i.position.length) {
            curPoss.pop();
            isZeroPoss.pop();
        }
    });
    //console.log(items.map(i => i.position.join(",")));
    items.sort((x, y) => {
        var px = x.position;
        var py = y.position;
        var xpl = px.length;
        var ypl = py.length;
        var l = Math.min(xpl, ypl);
        for (var i = 0; i < l; i++) {
            var d = px[i] - py[i];
            if (d) return d;
        }
        return xpl - ypl;
    });
}

export function parseLayout(items: FI.FormItem[], hert: boolean): Block {
    if (items.length == 1)
        return new FieldBlock(items[0]);

    sort(items);
    //console.log(items.map(i => i.position.join(",")));

    return new CombinedBlock(hert, items.map(it => new FieldBlock(it)));

    //return parseLayoutInternal(items, hert, 0);
   
}
