import * as React from 'react'

//import * as  api  from "../webapi-all";
export interface SigninPageProps {
    onChange?:(account:string,password:string,executing?:boolean)=>void;
    account?:string;
    password?:string;
    message?:string;
    executing?:boolean;
} 

export default class SigninPage extends React.Component<SigninPageProps> {
    constructor(props: SigninPageProps) {
        super(props);
    }
    render() {
        var p = this.props;
        return <div>
            <br/>
            <p>请您先登录管理系统：</p>
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
                                            value={p.account} 
                                            disabled={p.executing}
                                            onChange={(e) => p.onChange(e.target.value,p.password,p.executing)} 
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
                                            value={p.password} 
                                            disabled={p.executing}
                                            onChange={(e) => p.onChange(p.account,e.target.value,p.executing)} 
                                            />
                                    </div>
                                </div>
                                {p.message ? <div className="form-group clearfix field-Name">
                                    <label className="control-label">&nbsp;</label>
                                    <div className="control-content">
                                        {p.message}
                                    </div>
                                </div> : null}
                                <div className="form-group clearfix field-Name">
                                    <label className="control-label">&nbsp;</label>
                                    <div className="control-content field-size-sm">
                                        <button disabled={p.executing} onClick={() => p.onChange(p.account,p.password,true)} type="button" className="btn btn-primary">
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