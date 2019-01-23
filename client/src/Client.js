import React from 'react';
import openSocket from 'socket.io-client';

class Client extends React.Component {
    constructor(){
        super();
        this.state = {
            registered: false,
        }
        this.playerId = null;
        this.register = this.register.bind(this);
        this.submitAnswer = this.submitAnswer.bind(this);
    }

    componentDidMount() {
        this.socket = openSocket();
        this.socket.on('success', id => {
            this.playerId = id;
            console.log(this.playerId);
        })
    }

    register(){
        this.socket.emit('register', this.input.value);
        this.setState({registered: true});
        this.input.value = '';
    }

    submitAnswer() {
        let payload = {
            id: this.playerId,
            answer: this.input.value
        }
        console.log(payload);
        this.socket.emit('submit', payload);
        this.input.value = '';
    }

    render (){
        return (
            <div className="jumbotron">
                <textarea className="input form-control" ref={input => this.input = input}/>
                <Submit registered={this.state.registered} func={this.state.registered ? this.submitAnswer: this.register}/>
            </div>
        );
    }
}


class Submit extends React.Component {
    constructor(props){
        super(props);
        this.state = {...this.props};
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            registered: nextProps.registered,
            func: nextProps.func
        });
    }

    render() {
        return (
            <div>
                <button onClick={this.state.func} className="btn btn-success btn-large">
                    {this.state.registered ?
                    "Submit Answer"
                    :"Enter Name"}
                </button>
            </div>
        );
    }
}

export default Client;