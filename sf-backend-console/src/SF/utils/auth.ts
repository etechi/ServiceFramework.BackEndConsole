﻿
import * as  base64  from "./base64";
export interface IUser {
    id: string;
    nick: string;
    icon: string;
}

var _user: IUser = null;
var _usedInited=false;
function parseUserFromCookie() {
    var cs = document.cookie;
    var i = cs.indexOf(".sp.user=");
    if (i == -1) return null;
    i += 9;
    var j = cs.indexOf(';', i);
    var userStr = cs.substring(i, j == -1 ? cs.length : j);
    if (!userStr) return null;
    userStr = decodeURIComponent(userStr);
    var user = JSON.parse(base64.decode(userStr));
    return user;
}


export function user(): IUser {
    if (!_usedInited)
    {
        _usedInited=true;
        _user = parseUserFromCookie();
    }
    return _user;
}
export function update(user: IUser) {
    _user = user;
}

export function isMobile(s: string) {
    if (!s) return false;

    var reg = /^1[3|4|5|7|8][0-9]\d{4,8}$/;
    return s.length == 11 && reg.test(s);
}