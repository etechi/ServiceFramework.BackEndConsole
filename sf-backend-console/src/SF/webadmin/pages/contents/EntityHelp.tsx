import * as React from 'react'
import {IPageContent, IPageRender, IPageContentRefer,IPageBuildContext } from "../PageTypes";
import { EntityHelpContainer } from "../../../components/webapi/EntityHelpContainer";
export default async function build(ctn: IPageContent,ctx:IPageBuildContext): Promise<IPageRender>{
    var {lib, permissions}=ctx;
    var cfg = JSON.parse(ctn.Config);
    var readonly = cfg.ReadOnly;
    var entity = cfg.entity;
    const entityTitle = lib.getEntityTitle(entity) || entity;

    return { 
        
        component: class EntityHelp extends React.Component<any,any>{
            constructor(props: any) {
                super(props);
                //var re=getHeadComponents(()=>this,props.location.search); 
                //props.head(re.actions,re.nav);
                //this.state={queryIndex:re.queryIndex};
            }
            // componentWillReceiveProps(nextProps: Readonly<any>, nextContext: any){
            //     var re=getHeadComponents(()=>this,nextProps.location.search);
            //     nextProps.head(re.actions,re.nav);
            //     this.setState({queryIndex:re.queryIndex});
            // } 
           
            render() {
                
                return <EntityHelpContainer entity={entity}/>
            }
        }
    }
}
