import * as apicall from '../utils/apicall';
import * as ApiMeta from '../utils/ApiMeta';
import * as ApiFormManager from '../components/webapi/ApiFormManager';
import * as  ApiTableManager from '../components/webapi/ApiTableManager';
import { setup as setupEntityLinkBuilder } from '../utils/EntityLinkBuilder';

 
export interface IMenuItem {
    Title: string;
    FontIcon?: string
    Link?: string;
    Children?: IMenuItem[]
}
export interface IUser{
    Name: string;
    Icon: string;
}
export interface IBackEndConsoleSetting {
    User: IUser;
    MenuItems: IMenuItem[]
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

        //setupEntityLinkBuilder([result.entityLinkBuilders], urlRoot);

        var tm = new ApiTableManager.ApiTableManager(apiForms);
        //modules.filter(m => m.api && m.api.queries ? true : false).forEach(m =>
        //    m.api.queries.forEach(f => tm.createTable(f))
        //);
        ApiTableManager.setDefaultTableManager(tm);

        return { User: user, MenuItems: setting.MenuItems};
    });
}
    