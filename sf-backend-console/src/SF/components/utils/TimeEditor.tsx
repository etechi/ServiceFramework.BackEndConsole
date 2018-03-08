import * as React from 'react';
import {upload} from "./Uploader";
import TimePicker from 'rc-time-picker';
import * as moment from 'moment';
require("rc-time-picker/assets/index.css");
export interface TimeEditorProps{
    disabled?: boolean;
    value?: string;
    onChange?(v: string): void;
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
        return <TimePicker disabled={this.props.disabled} defaultValue={moment()}  showSecond={false} />
    }

}
