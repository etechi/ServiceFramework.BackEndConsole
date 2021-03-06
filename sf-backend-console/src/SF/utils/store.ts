﻿//var EverCookie = require("./3party/evercookie.js").EverCookie;
//function newEverCookie() {
//    return new EverCookie(
//        {
//            history: true, // CSS history knocking or not .. can be network intensive
//            java: true, // Java applet on/off... may prompt users for permission to run.
//            tests: 10,  // 1000 what is it, actually?
//            silverlight: true, // you might want to turn it off https://github.com/samyk/evercookie/issues/45
//            domain: '.' + window.location.host.replace(/:\d+/, ''), // Get current domain
//            baseurl: '', // base url for php, flash and silverlight assets
//            asseturi: '/content/evercookie', // assets = .fla, .jar, etc
//            phpuri: '/php', // php file path or route
//            authPath: false, //'/evercookie_auth.php', // set to false to disable Basic Authentication cache
//            pngCookieName: 'evercookie_png',
//            pngPath: '/evercookie_png.php',
//            etagCookieName: 'evercookie_etag',
//            etagPath: '/evercookie_etag.php',
//            cacheCookieName: 'evercookie_cache',
//            cachePath: '/evercookie_cache.php',
//            hsts: false,
//            hsts_domains: []
//        }
//    );
//}

declare var require: any;
var store = require("./3party/store.js");

export function set(id: string, value: string) {
    //var ec = newEverCookie();
    //ec.set(id, value);
    store.set(id, value);
}

export function get(id: string,timeout:number=3000) {
    //return new Promise<string>((resolve, reject) => {
    //    var timer = setTimeout(() => {
    //        timer = null;
    //        reject("Timeout");
    //    },timeout);
    //    var ec = newEverCookie();
    //    ec.get(id, value => {
    //        if (timer) {
    //            clearTimeout(timer);
    //            timer = null;
    //            resolve(value);
    //        }
    //    });
    //});

    return Promise.resolve(store.get(id));
}

export function setObjValues(id: string, obj: any) {
    return getObject(id).then(re => {
        if (obj) {
            for (var k in obj) {
                var v = obj[k];
                if (!v)
                    delete re[k];
                else
                    re[k] = v;
            }
            set(id, JSON.stringify(re));
        }
        return re;
    });
}


export function getObject(id: string) {
    var cb = re => {
        var c: any;
        if (re)
            try {
                c = JSON.parse(re);
            } catch (ex) { }
        if (!c) c = {};
        return c;
    };
    return get(id).then(cb, () => cb(null));
}


if (!localStorage) {
    alert("需要浏览器支持localStorage!!");
    throw "需要浏览器支持localStorage!!";
}

var memoryStorage = {};
function syncMemoryStorage() {
    try {
        localStorage.setItem("$SF-SessionStorage", JSON.stringify(memoryStorage));
    }
    finally {
        localStorage.removeItem("$SF-SessionStorage");
    }
}
window.addEventListener("storage", e => {
    if (e.key == "$SF-Get-MemoryStorage") {
        syncMemoryStorage();
    }
    else if (e.key == "$SF-SessionStorage") {
        memoryStorage = JSON.parse(e.newValue);
    }
});
localStorage.setItem("$SF-Get-MemoryStorage", Date.now() + "");

export function getMemoryObject(id: string): any {
    return memoryStorage[id];
}
export function setMemoryObject(id: string, value: any): void {
    if (value === undefined)
        delete memoryStorage[id];
    else
        memoryStorage[id] = value;
    syncMemoryStorage();
}
