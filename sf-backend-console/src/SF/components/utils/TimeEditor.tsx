import * as React from 'react';
import {upload} from "./Uploader";
import TimePicker from 'rc-time-picker';
import * as moment from 'moment';
require("rc-time-picker/assets/index.css");
export interface TimeEditorProps{
    disabled?: boolean;
    value?: number;
    onChange?(v: number): void;
    className?: string;
}
interface state{
}
export class TimeEditor extends React.Component<TimeEditorProps, state>{
    constructor(props:any){ 
        super(props);
        this.state={};
    }
     
    componentDidMount() {
        if (this.props.disabled)
            return;
       
    }

    componentWillReceiveProps(nextProps: TimeEditorProps, nextContext: any): void {
       
    }
    render() {
        return <TimePicker 
        disabled={this.props.disabled}
         defaultValue={moment((this.props.value || 0)*60*1000-8*3600*1000)} 
         onChange={
            (m)=>{
                this.props.onChange(Math.floor(m.valueOf()/1000/60+8*60));
            }
            } 
        showSecond={false}
         />
    }

}
