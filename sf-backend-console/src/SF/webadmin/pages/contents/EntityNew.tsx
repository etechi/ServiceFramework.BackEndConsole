﻿import * as React from 'react'
import * as ReactRouter from 'react-router'
import { Link } from "react-router-dom";

import { EntityEditor} from "../../../components/webapi/EntityEditor";
import * as ApiMeta from "../../../utils/ApiMeta";
import * as Meta from "../../../utils/Metadata";
import { show as showModal } from "../../../components/utils/Modal";
import { IPageContent, IPageRender, IPageContentRefer } from "../PageTypes";

export default function build(lib: ApiMeta.Library, ctn: IPageContent): IPageRender{
    var cfg = JSON.parse(ctn.Config);
    var readonly = cfg.ReadOnly;
    var entity = cfg.entity;
    const entityTitle = lib.getEntityTitle(entity) || entity;

    const controller = lib.getEntityController(cfg.entity);
    if (!controller)
        throw "找不到实体控制器：" + cfg.entity;

    return {
        component: class EntityList extends React.Component<any>{
            render() {
                return <EntityEditor
                    controller={controller.Name}
                    serviceId={cfg.service}
                    onBuildSubmitPanel={(p, s,cmds) => {
                        this.props.head(cmds);
                        return <div></div>;
                    }}
                    />
            }
        }
    }
}
