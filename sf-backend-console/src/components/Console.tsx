import * as React from 'react';
import { Location } from 'history';
import * as PropTypes from 'prop-types';
import { Route,Redirect } from 'react-router';
 
import createDashboard from './Dashboard';
import AdminSetting from './AdminSetting';

import * as WA from '../SF/webadmin';
import { Image } from '../SF/components/utils/Image';
// import modules from '../modules';
// import * as  api  from '../webapi-all';
import * as auth from '../SF/utils/auth';
import SigninPage from './SigninPage';
import * as apicall from '../SF/utils/apicall';
import * as Setting from '../SF/webadmin/BackEndConsoleSetting';
import * as  superagent from 'superagent';
import * as base64 from '../SF/utils/base64';

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
        executing?:boolean;
        message?:string;

    },
    state?:SigninState,
    setting?: Setting.IBackEndConsoleSetting;
}
var env = (window as any)["ENV"] || {root:"/",menu:"default"};

export default class AppFrame extends React.Component<AppFrameProps, state> {
    constructor(props: AppFrameProps,ctx:any) {
        super(props, ctx);
        this.state= {state:SigninState.loading}
    }
    handleSignout() {
         if (sessionStorage)
              sessionStorage.removeItem("access-token");
         this.setState({ state: SigninState.unsigned, setting: null, form: {} });
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
        this.setState({ state: SigninState.unsigned, setting:null, form: {} });
    }
    loadData() {
        Setting.loadSetting(env.root).then(s => {
            this.setState({ state: SigninState.signed, form: null, setting:s });
        });

    }
    handleSignin( acc:string, pwd:string,captcha:string){
        this.setState({form:{executing:true,message:""}});
        if(!acc || !pwd || !captcha)
        {
            this.setState({
                form:{executing:false,message:"请输入账号密码及验证码"}
            });
            return;
        }

        superagent
            .post("/api/user/signin")
            .type('application/json')
            //.set("Authorization","Basic "+base64.encode( "admin.console:pass"))
            .send({
                Ident:acc,
                Password:pwd,
                Mode:'AccessToken',
                ClientId:'admin.console',
                CaptchaCode:captcha
            }) 
            .end((err,re) => {
                if(err){
                    this.setState({
                        form: {
                            executing: false,
                            message: re.body.Message || "登录失败，请重试"
                        }
                    });
                    return;
                }
                var token=re.body;
                apicall.setAccessToken(token);
                if (sessionStorage)
                    sessionStorage.setItem(
                        "access-token",
                        token
                    );
                this.setState({state:SigninState.loading});
                this.loadData();
            }, err => {
                this.setState({
                    form: {
                        executing: false,
                        message: err
                    }
                });
            }); 
    }
    render(){
        var path=this.props.location.pathname;
        var state=this.state || {};
        var signin = state.form || {};
        var setting = state.setting;
        return <WA.Application>
            <WA.Header.Container>
                <WA.Header.Logo>{setting?setting.Title:""}</WA.Header.Logo>
                {setting && setting.User ? <WA.Header.Text to={setting?"/admin/setting/"+setting.User.Id:"/"}>
                    <Image className="img-circle" format="c30" res={setting.User.Icon} />
                    <span className="username username-hide-on-mobile">{setting.User.Name}</span>
                </WA.Header.Text> : null}
                {setting?<WA.Header.Button onClick={() => this.handleSignout() }><i className="icon-logout"></i></WA.Header.Button>:null}
            </WA.Header.Container>
            {setting ? <WA.SideBar.Container pathPrefix={"/"} menuGroups={setting.MenuItems/* modules.map(m => m.menu) */} curPath={path} >
                {/*<WA.SideBar.SearchBox></WA.SideBar.SearchBox>*/}
                {/*<WA.SideBar.MenuItem icon='icon-home' name='首页' to='/' isActive={false}/>*/}
            </WA.SideBar.Container> : null}
            {/*<WA.Footer>footer</WA.Footer>*/}
            {state.state==SigninState.loading?<h3>载入中...</h3>:
            state.state==SigninState.unsigned?<SigninPage 
                executing={signin.executing} 
                message={signin.message} 
                onSubmit={(acc,pwd,captcha)=>this.handleSignin(acc,pwd,captcha)}/>:
                null}
            {setting? <Route path="/" exact render={()=><Redirect to="/ap/entity/Patient/"/>}/>:null}
            {setting ? <Route path="/ap" component={setting.AutoPage}/>:null}
            {setting ? <Route exact path="/admin/setting/:id" component={AdminSetting}/>:null}
        </WA.Application>
    }
} 