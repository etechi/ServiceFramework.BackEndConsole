﻿import * as React from 'react'
import assign from '../../utils/assign';
import * as  time  from "../../utils/time";
declare var require: any;
var RDatePicker = require("react-datepicker").default;
var moment = require("moment");
var moment_locale = require("moment/locale/zh-cn");
moment.locale("zh-cn");

import 'react-datepicker/dist/react-datepicker.css';

export interface DatePickerProps{
    className?: string;
    value?: any;
    onChange?(e: any): void;
    minDate?: any;
    maxDate?: any;
    todayButton?: string;
    dateFormat: string;
}

export class DatePicker extends React.Component<DatePickerProps, {}>{
    render() {
        var props = assign(this.props, {} as any) as any;
        var selected = props.value && time.parse(props.value) || null;
        if (props.endTimeMode && selected)
            selected = moment(selected).add(-1, 'days');

        var placeholderText = props.placeholder;
        var onChange = props.onChange;
        props.onChange = (v) => {
            if (v && props.endTimeMode)
                v = moment(v).add(1, 'days');
            onChange(v);
        };
        delete props.placeholder;
        delete props.value;
        if (!props.dateFormat) props.dateFormat = props.disabled ? "YYYY-MM-DD HH:mm": "YYYY-MM-DD";
        return <RDatePicker locale="zh-cn" placeholderText={placeholderText} selected={selected} {...props} />
    }
}