﻿import * as React from 'react'

//var help = require("html!markdown!../help/index.md");
//var help = require("../help/index.md");

export interface DashboardProps {
} 

//var TestForm = buildFormComponent({
//    fields: [
//        {
//            name: "name",
//            element(prop: any) {
//                return <CS.TextBox type="text" label="名称" {...prop}/>;
//            }
//        },
//        {
//            name: "password",
//            element(prop: any) {
//                return <CS.TextBox type="password" label="密码" {...prop}/>;
//            }
//        }
//    ],
//    validate(v: any) {
//        var re:any = {};
//        if (!v.name) re.name = "需要名称";
//        if (!v.password) re.password = "需要密码";
//        return re;
//    },
//    onSubmit(a) {
//        alert(JSON.stringify(a));
//    }
//});

export default function createDashboard(setting:any){
    return class Dashboard extends React.Component<DashboardProps, {}> {
        render() {
            return <div>
                <h1 style={{textAlign:"center",paddingTop:"200px"}}>{setting.Title}</h1>
            </div>
        }
    }
}