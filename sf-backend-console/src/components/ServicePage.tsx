import * as React from 'react'
import * as ReactRouter from 'react-router'
import * as apicall from 'SF/utils/apicall';
import * as Views from 'SF/webadmin/components/Views';
import * as Page from "SF/webadmin/components/Page"
interface PageContent{
    Path:string;
    Type:string;
    Config:string;
    Children?:PageContent[]
}
interface PageConfig{
    Path:string;
    Title:string;
    Links:{To?:string,Text:string}[];
    Content:PageContent
}

interface CachedPage{
    component:any,
    title:string,
    path:string,
    links:{to?:string,text:string}[];
}

export interface ServicePageProps {
  match: ReactRouter.match<{path:string}>
  location:any
} 
var pageCache:{[index:string]:CachedPage}={};

interface state{
    page?:CachedPage
}

const ContentBuilders={
    EntityList(cfg:PageContent){
        // Views.ListView({
        //     links: [{ text: ctx.module.title }, { text: cfg.t }],
        //     controller: controller.Name,
        //     serviceId: ctx.item.service,
        //     action: QueryAction ? 'Query' : 'List',
        //     headerLinks: !readonly && CreateAction && (ctx.item.entityMode != EntityItemMode.NoCreate) ? [{ to: ctx.cfg.urlRoot + ctx.linkBase + entityEncoded + '/new', text: '添加' + entityTitle }] : null,
        //     headerActionBuilders: headActionBuilders,
        //     actionBuilders: actionBuilders,
        //     readonly: readonly
        // })
        
    }
}

function buildComponent(cfg:PageConfig):CachedPage{
    
    return {
        path:cfg.Path,
        title:cfg.Title,
        links:cfg.Links.map(l=>({to:l.To,text:l.Text})),
        component:null
    };
}


export default class ServicePage extends React.Component<ServicePageProps,state> {
    constructor(props: ServicePageProps) {
        super(props);
        var path=props.match.params.path;
        var p=pageCache[props.match.params.path];
        this.state={page:p};
        if(!p)
            this.loadPage(path);
    }
    loadPage(path:string){
        apicall.call("BackEndAdminConsole","GetPage",{ConsoleIdent:"default",PagePath:path}).then((re:any)=>{
            var p=pageCache[path]=buildComponent(re);
            this.setState({page:p});
        });
    }
    componentWillReceiveProps(nextProps: Readonly<ServicePageProps>, nextContext: any){
        var newPath=nextProps.match.params.path;
        var orgPath=this.props.match.params.path;
        if(newPath==orgPath)
            return;
        this.loadPage(newPath);
    }
    render() {
        var p = this.props;
        var page=this.state.page;

       return <Page.Container >
            <Page.Header links={page.links}>
            </Page.Header>
            <Page.Content>
                {page?React.createElement(page.component,{location:p.location,match:p.match}):<div>载入中...</div>}
            </Page.Content>
        </Page.Container>
    }
}