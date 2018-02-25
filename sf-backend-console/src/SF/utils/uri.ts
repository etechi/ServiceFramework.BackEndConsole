
export function getQueryValue(name: string, url?: string) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
export function parseSearch(search: string): { [index: string]: string } {
    if (search.charAt(0) == '?') search = search.substring(1);
    var re: { [index: string]: string } = {};
    search.split('&').forEach(p => {
        var ps = p.split('=');
        re[decodeURIComponent(ps[0])] = decodeURIComponent(ps[1]);
    });
    return re;
}