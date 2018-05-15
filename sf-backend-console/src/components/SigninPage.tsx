import * as React from 'react'
import * as apicall from '../SF/utils/apicall';

//import * as  api  from "../webapi-all";
export interface SigninPageProps {
    onSubmit?:(account:string,password:string,captcha:string)=>void;
    message?:string;
    executing?:boolean;
} 

interface state{
    captchaPrefix?:string;
    captchaImage?:string;
    account?:string;
    password?:string;
    captcha?:string;
    
}
export default class SigninPage extends React.Component<SigninPageProps,state> {
    constructor(props: SigninPageProps) {
        super(props);
        this.state={account:"",password:"",captcha:""};
        this.updateCaptchaImage();
    }
    updateCaptchaImage(){
        apicall.call<any>(
            "CaptchaImage","CreateImage",
            {},
            {
                Width:200,
                ForeColor:"#403333ff",
                Target:"User.Signin"
            }
        ).then(re=>{
            this.setState({captchaPrefix:re.CodePrefix,captchaImage:re.Image})
        });
    }
    render() {
        var p = this.props;
        var s = this.state;
        return <div>
            <br/>
            <h2>登录系统</h2>
            <br />
            <form className="dynamic-form ">

                <div className="form-group clearfix field-Entity">

                    <div className="control-content ">
                        <div className="form-item-set">
                            <div className="vbox">
                                <div className="form-group clearfix field-Name">
                                    <label className="control-label">账号</label>
                                    <div className="control-content field-size-sm">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="请输入账号" 
                                            maxLength={50} 
                                            value={s.account} 
                                            disabled={p.executing}
                                            onChange={(e) => this.setState({account:e.target.value})} 
                                            />
                                    </div>
                                </div>
                                <div className="form-group clearfix field-Name">
                                    <label className="control-label">密码</label>
                                    <div className="control-content field-size-sm">
                                        <input 
                                            type="password" 
                                            className="form-control" 
                                            maxLength={50} 
                                            value={s.password} 
                                            disabled={p.executing}
                                            onChange={(e) => this.setState({password:e.target.value})} 
                                            />
                                    </div>
                                </div>
                                {s.captchaImage? <div className="form-group clearfix field-Name">
                                    <label className="control-label">验证码</label>
                                    <div className="control-content field-size-sm">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            maxLength={6} 
                                            value={s.captcha} 
                                            disabled={p.executing}
                                            onChange={(e) => this.setState({captcha:e.target.value})} 
                                            />
                                        <img src={s.captchaImage} onClick={()=>this.updateCaptchaImage()}/>
                                    </div>
                                </div>:null} 
                                {p.message ? <div className="form-group clearfix field-Name">
                                    <div className="control-content" style={{marginLeft:"150px"}}>
                                        {p.message}
                                    </div>
                                </div> : null}
                                <div className="form-group clearfix field-Name">
                                    <div className="control-content field-size-sm"style={{marginLeft:"150px"}}>
                                        <button  disabled={p.executing} onClick={(e) =>{e.preventDefault();e.stopPropagation();p.onSubmit(s.account,s.password,s.captchaPrefix+s.captcha)}} type="submit" className="btn btn-primary">
                                            <span className={['fa', p.executing?'fa-':'fa-key'].concat(p.executing?["fa-spin"]:[]).join(' ')}></span>
                                            登 录
                                        </button>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    }
}