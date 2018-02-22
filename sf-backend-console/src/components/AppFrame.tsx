import * as React from 'react';
import Dashboard from './Dashboard';
import * as WA from 'SF/webadmin';
import { Image } from 'SF/components/utils/Image';
// import modules from '../modules';
// import * as  api  from '../webapi-all';
import * as auth from 'SF/utils/auth';
import { Location } from 'history';
import * as PropTypes from 'prop-types';
import * as menu from 'SF/webadmin/menu-types';
import SigninPage from './SigninPage';
import { Route } from 'react-router';
import * as apicall from 'SF/utils/apicall';
import * as Meta from 'SF/utils/Metadata';
import * as ApiMeta from 'SF/utils/ApiMeta';
import * as ApiFormManager from 'SF/components/webapi/ApiFormManager';
import * as  ApiTableManager  from 'SF/components/webapi/ApiTableManager';
import { setup as setupEntityLinkBuilder } from 'SF/utils/EntityLinkBuilder';
import * as config from '../config';
import { IManagerBuildResult } from 'SF/webadmin/ManagerBuilder';
import * as  superagent from 'superagent';
import * as base64 from 'SF/utils/base64';
import { setMemoryObject, getMemoryObject } from 'SF/utils/store';

export interface AppFrameProps {
    location?: Location;
}
enum SigninState {
    loading,
    signed,
    unsigned,
}
interface state {
    form?:{
        account?:string;
        password?:string;
        executing?:boolean;
        message?:string;
    },
    state?:SigninState,
    routes?:JSX.Element[];
    menus?:menu.IMenuCategory[];
    user?:{nick:string,icon:string};
}
var env = (window as any)["ENV"] || {root:"",menu:"default"};

export default class AppFrame extends React.Component<AppFrameProps, state> {
    constructor(props: AppFrameProps,ctx:any) {
        super(props, ctx);
        this.state= {state:SigninState.loading}
    }
    handleSignout() {
         if (sessionStorage)
              sessionStorage.removeItem("access-token");
         this.setState({ state: SigninState.unsigned, user: null, form: {} });
    }
    componentDidMount() {
        if (sessionStorage){
            var token = sessionStorage.getItem("access-token");
            if (token) {
                apicall.setAccessToken(token);
                this.loadData();
                return;
            }
        }
        this.setState({ state: SigninState.unsigned, user: null, form: {} });
    }
    loadData() {
        Promise.all([
            apicall.call("ServiceMetadata", "Json"),
            apicall.call("Menu", "GetMenu", { Ident: "default" }),
            apicall.call("User", "GetCurUser")
            //api.User.GetPermissions() 
        ]).then(re => {
            var lib = new ApiMeta.Library(re[0] as any);
            var items: any = re[1];
            var user: any = re[2];

            var permissions: any = re[3];
            ApiMeta.setDefaultLibrary(lib);

            var apiForms = new ApiFormManager.ApiFormManager(lib, null);//formItemAdjuster.itemAdjuster);
            ApiFormManager.setDefaultFormManager(apiForms);
            var result = config.build(lib, env.root, permissions, items, window.location.href.indexOf("all=true") != -1);

            setupEntityLinkBuilder([result.entityLinkBuilders], env.root);

            var tm = new ApiTableManager.ApiTableManager(apiForms);
            //modules.filter(m => m.api && m.api.queries ? true : false).forEach(m =>
            //    m.api.queries.forEach(f => tm.createTable(f))
            //);
            ApiTableManager.setDefaultTableManager(tm);

            this.setState({ state: SigninState.signed, form: null, menus: result.menus, routes: result.routes, user: { nick: user.Name, icon: user.Icon } });
        });
    }
    handleSigninChanged( acc:string, pwd:string, exec:boolean){
        this.setState({form:{account:acc,password:pwd,executing:exec,message:""}});
        if(!exec)
            return;
        if(!acc || !pwd)
        {
            this.setState({
                form:{account:acc,password:pwd,executing:false,message:"请输入账号密码"}
            });
            return;
        }

        superagent
            .post("/connect/token")
            .type('form')
            .set("Authorization","Basic "+base64.encode( "admin.console:pass"))
            .send({
                grant_type:'password',
                username:acc,
                password:pwd,
                scope:'all'
            })
            .end((err,re) => {
                if(err){
                    this.setState({
                        form: {
                            account: acc,
                            password: pwd,
                            executing: false,
                            message: "登录失败，请检查账号密码是否正确！"
                        }
                    });
                    return;
                }
                apicall.setAccessToken(re.body.access_token);
                if (sessionStorage)
                    sessionStorage.setItem(
                        "access-token",
                        re.body.access_token
                    );
                this.setState({state:SigninState.loading});
                this.loadData();
            }, err => {
                this.setState({
                    form: {
                        account: acc,
                        password: pwd,
                        executing: false,
                        message: err
                    }
                });
            }); 
    }
    render(){
        var path=this.props.location.pathname;
        var state=this.state || {};
        var signin=state.form || {};
        var u = state.user;
        return <WA.Application>
            <WA.Header.Container>
                <WA.Header.Logo>系统管理中心</WA.Header.Logo>
                {u ? <WA.Header.Text to={"/admin/" + encodeURIComponent("系统安全") + "/AdminInfo"}>
                    <Image className="img-circle" format="c30" res={u.icon} />
                    <span className="username username-hide-on-mobile">{u.nick}</span>
                </WA.Header.Text> : null}
                {u?<WA.Header.Button onClick={() => this.handleSignout() }><i className="icon-logout"></i></WA.Header.Button>:null}
            </WA.Header.Container>
            {u ? <WA.SideBar.Container pathPrefix={"/"} menuCategories={state.menus/* modules.map(m => m.menu) */} curPath={path} >
                {/*<WA.SideBar.SearchBox></WA.SideBar.SearchBox>*/}
                <WA.SideBar.MenuItem icon='icon-home' name='首页' to='/' isActive={false}/>
            </WA.SideBar.Container> : null}
            {/*<WA.Footer>footer</WA.Footer>*/}
            {state.state==SigninState.loading?<h3>载入中...</h3>:
            state.state==SigninState.unsigned?<SigninPage 
            account={signin.account} 
            password={signin.password} 
            executing={signin.executing} 
            message={signin.message} 
            onChange={(acc,pwd,exec)=>this.handleSigninChanged(acc,pwd,exec)}/>:
            null}
            {state.state==SigninState.signed?<Route exact path="/" component={Dashboard}/>:null}
            {state.state==SigninState.signed?this.state.routes:null}
        </WA.Application>
    }
} 