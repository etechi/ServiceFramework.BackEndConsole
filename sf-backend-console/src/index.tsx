import * as React from 'react';
import { render } from 'react-dom'
import { Route } from 'react-router'
import {BrowserRouter} from 'react-router-dom'

import {createBrowserHistory} from 'history';
var browserHistory=createBrowserHistory();

//import  AppFrame from "./components/AppFrame";
import Console from "./components/Console";

var env = (window as any)["ENV"] || {root:"",menu:"default"};


function main(){


    render(
    <BrowserRouter basename={env.root}>
        <Route component={Console}/>
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
