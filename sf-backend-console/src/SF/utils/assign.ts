﻿ export default function assign<T>(dst: T, vars: any): T {
    var re: any = {};
    for (var k in dst) {
        re[k] = dst[k];
    }
    for (var kk in vars) {
        var v = vars[kk];
        if (v === undefined)
            delete re[kk];
        else
            re[kk] = vars[kk];
    }
    return re;
}
