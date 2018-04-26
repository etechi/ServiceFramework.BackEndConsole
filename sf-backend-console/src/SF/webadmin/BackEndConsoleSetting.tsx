import * as apicall from '../utils/apicall';
import * as ApiMeta from '../utils/ApiMeta';
import * as ApiFormManager from '../components/webapi/ApiFormManager';
import * as  ApiTableManager from '../components/webapi/ApiTableManager';
import { setup as setupEntityLinkBuilder } from '../utils/EntityLinkBuilder';
import BuildPage from "./pages/AutoPage";

 
export interface IMenuItem {
    Title: string;
    FontIcon?: string
    Link?: string;
    Children?: IMenuItem[]
}
export interface IUser{
    Id:number;
    Name: string;
    Icon: string;
}
export interface IBackEndConsoleSetting {
    Title:string;
    Library: ApiMeta.Library;
    User: IUser;
    MenuItems: IMenuItem[];
    AutoPage: any;
}



export function loadSetting(urlRoot:string): PromiseLike<IBackEndConsoleSetting> {
    return Promise.all([
        apicall.call("ServiceMetadata", "Json"),
        apicall.call("BackEndAdminConsole", "GetConsole", { ConsoleIdent: "default" }),
        apicall.call("User", "GetCurUser")
    ]).then(re => {
        var lib = new ApiMeta.Library(re[0] as any);
        var setting: any = re[1];
        var user: any = re[2];

        ApiMeta.setDefaultLibrary(lib);
        var apiForms = new ApiFormManager.ApiFormManager(lib, null);//formItemAdjuster.itemAdjuster);
        ApiFormManager.setDefaultFormManager(apiForms);

        //var result = config.build(lib, urlRoot, null, items, window.location.href.indexOf("all=true") != -1);
        var entities = lib.getEntities();
        var linkBuilders = {};
        entities.forEach(e => linkBuilders[e] = (ids: any[], svc) =>
            `/ap/entity/${e}/detail/${svc}?id=${ids.join('/')}`)
        setupEntityLinkBuilder([linkBuilders], "");

        var tm = new ApiTableManager.ApiTableManager(apiForms);
        //modules.filter(m => m.api && m.api.queries ? true : false).forEach(m =>
        //    m.api.queries.forEach(f => tm.createTable(f))
        //);
        ApiTableManager.setDefaultTableManager(tm);
        return {
            Title:setting.Title,
            Library: lib,
            User: user,
            MenuItems: setting.MenuItems.reverse(),
            AutoPage: BuildPage(lib,setting.EntityPermissions)
        };
    });
}
    