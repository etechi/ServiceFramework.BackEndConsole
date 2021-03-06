﻿import * as React from 'react';

export class Loading extends React.Component<{delay?:number}, {visible:boolean}>
{
    _timer=0;
    constructor(props:any){
        super(props); 
        this.state={visible:this.props.delay===0};
    }
    componentDidMount(){
        if(this.props.delay===undefined || this.props.delay)
            this._timer=window.setTimeout(()=>{ 
                this._timer=0;
                this.setState({visible:true});
                },this.props.delay || 500);
    }
    componentWillUnmount(){
        if(this._timer)
            window.clearTimeout(this._timer);
    }
    render() {
        if(!this.state || !this.state.visible)
            return null;
        return <div className="sk-circle">
          <div className="sk-circle1 sk-child"></div>
          <div className="sk-circle2 sk-child"></div>
          <div className="sk-circle3 sk-child"></div>
          <div className="sk-circle4 sk-child"></div>
          <div className="sk-circle5 sk-child"></div>
          <div className="sk-circle6 sk-child"></div>
          <div className="sk-circle7 sk-child"></div>
          <div className="sk-circle8 sk-child"></div>
          <div className="sk-circle9 sk-child"></div>
          <div className="sk-circle10 sk-child"></div>
          <div className="sk-circle11 sk-child"></div>
          <div className="sk-circle12 sk-child"></div>
        </div>
    }
}