import * as React from 'react';
import { render } from 'react-dom'
import { Route } from 'react-router'
import {BrowserRouter} from 'react-router-dom'

//import * as  formItemAdjuster  from "./formItemAdjuster";

import * as WA from "SF/webadmin";
//import * as assign from "SF/utils/assign";
import * as Meta from "SF/utils/Metadata";
import * as ApiMeta from "SF/utils/ApiMeta";
import * as ApiFormManager from "SF/components/webapi/ApiFormManager";
import * as  ApiTableManager  from "SF/components/webapi/ApiTableManager";
import { setup as setupEntityLinkBuilder } from "SF/utils/EntityLinkBuilder";
import * as apicall from "SF/utils/apicall";
import {createBrowserHistory} from 'history';
var browserHistory=createBrowserHistory();


import  AppFrame from "./components/AppFrame";

var env = (window as any)["ENV"] || {root:"",menu:"default"};


function main(){


    render(
    <BrowserRouter basename={env.root}>
        <Route component={AppFrame}/>
    </BrowserRouter>
    , document.getElementById('root'))

}

main();




function removeQuery(s: string) {
    if (!s) return s;
    var i = s.indexOf('?');
    return i == -1 ? s : s.substring(0, i);
}

browserHistory.listen(l => {
    //var loc = window.location.href;
    //var re = loc.match(/^https?:\/\/[^\/]+\/admin\/[^\/]+\/([^\/]+)$/);
    //var res = removeQuery(re && re[1]);
    //if (re && res) {
    //    api.AuditService.AddRecord({
    //        Resource: decodeURIComponent(res),
    //        Operation: "查询"
    //    });
    //    return;
    //}

    //var re = loc.match(/^https?:\/\/[^\/]+\/admin\/[^\/]+\/([^\/]+)\/([^\/]+)\/([^\/]+)$/);
    //var id = removeQuery(re && re[3]);
    //if (re && id) {
    //    api.AuditService.AddRecord({
    //        DestId: decodeURIComponent(re[1]) + "-" + decodeURIComponent(id),
    //        Resource: decodeURIComponent(re[1]),
    //        Operation: "浏览"
    //    });
    //    return;
    //}
});
