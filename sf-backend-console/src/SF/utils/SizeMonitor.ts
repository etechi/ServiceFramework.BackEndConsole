﻿
export function monitor(dom: HTMLElement, onResize: (width: number, height: number)=>void):()=> void{
    var div= <HTMLDivElement>dom;
    var w= 0;
    var h= 0; 
    
    var refresh=()=>{
        var nw = div.clientWidth;
        var nh = div.clientHeight;
        if (nw != w || nh != h) {
            w = nw;
            h = nh;
            onResize(w, h);
        }
    }
    var timer = window.setInterval(refresh, 100);
    window.addEventListener("resize", refresh);
    return ()=>{
        if (!timer) return;
        window.clearInterval(timer);
        timer = null;
        window.removeEventListener("resize", refresh);
    };
}