﻿import * as  Meta  from "./Metadata";

export interface RawLibrary  extends Meta.RawLibrary{
    SettingTypes: string[];
}
export class Library extends Meta.Library{
    constructor(lib: RawLibrary) {
        super(lib);
    }
     SettingTypes(){return this.rawLibrary().SettingTypes;}
    rawLibrary() {
        return <RawLibrary>super.rawLibrary();
    }
}

export function load(lib: RawLibrary): Library {
    return new Library(lib);
}

var _lib:Library=null;
export function setDefaultLibrary(lib:Library){
    _lib=lib;
}
export function defaultLibrary(){
    return _lib;
}