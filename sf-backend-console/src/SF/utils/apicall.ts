import * as  superagent from "superagent";
import * as  bluebird  from "bluebird";

function uri_encode(values: any) {
    var qs = [];
    for (var k in values) {
        var v = values[k]; 
        if (v === undefined || v===null) continue;
        qs.push(encodeURIComponent(k) + "=" + encodeURIComponent(v+""));
    }
    return qs.join("&");
};
var _accessToken=null;
export function setAccessToken(token:string):void{
    _accessToken=token;
}
export function getAccessToken(){
    return _accessToken;
}
export interface IQueryPaging {
    offset?: number;
    limit?: number;
    sortMethod?: string;
    sortOrder?: "Asc" | "Desc";
    totalRequired?: boolean;
    summaryRequired?: boolean;
}
export interface ICallOptions {
    serviceId?: number;
    paging?: IQueryPaging,
    query?:any
}
export function call<R>(
    type: string,
    method: string,
    query?: { [index: string]: any },
    form?: { [index: string]: any },
    opts?: ICallOptions
) {
    var args = query || {};
    var heavy = null;
    if (form) {
        heavy = "__form";
        args["__form"] = form;
    }
    return apicall<R>(type, method, heavy, args, opts);
}
export function apicall<R>(
    type: string,
    method: string,
    heavy: string,
    args: { [index: string]: any },
    opts: ICallOptions
) {
    return new Promise<R>((resolve, reject) => {
        var uri = "/api/" + type;
        if (opts && opts.serviceId)
            uri += "/" + opts.serviceId;
        uri += "/" + method;

        var q: any = {};
        var post: any = null;
        if (args)
            for (var k in args)
            {
                if (k == heavy)
                    post = args[k];
                else
                    q[k] = args[k];
            }
        if (opts) {
            if (opts.paging) {
                if (!post) post = {};
                if (!post.Paging) post.Paging = {};
                if (opts.paging.offset) post.Paging.Offset = opts.paging.offset;
                if (opts.paging.limit) post.Paging.Count = opts.paging.limit;
                if (opts.paging.sortMethod) post.Paging.SortMethod = opts.paging.sortMethod;
                if (opts.paging.sortOrder) post.Paging.SortOrder = opts.paging.sortOrder;
                if (opts.paging.totalRequired) post.Paging.TotalRequired = opts.paging.totalRequired;
                if (opts.paging.summaryRequired) post.Paging.SummaryRequired = opts.paging.summaryRequired;
            }
            if (opts.query)
                for (var k in opts.query)
                    q[k] = opts.query[k];
        }
        var has_query_vars = false;
        for (var k in q) {
            has_query_vars = true;
            break;
        }
        if (has_query_vars )
            uri += "?" + uri_encode(q);
        var sa = post ? superagent("POST", uri) : superagent(uri);
        if (post) sa.send(post);
        if(_accessToken)
            sa.set("Authorization","Bearer "+_accessToken);
        return sa.end((e, r) => {
            if (e) {
                return reject({
                    _netDown: !e.status && !r,
                    _error: r && r.body && r.body.Message || "网络故障，请稍后再试..."
                });
            }
            resolve(<R>r.body);
        });
    })
}