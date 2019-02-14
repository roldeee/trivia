import React from 'react';
import openSocket from 'socket.io-client';
import cookie from './cookie.js';

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
            cookie.setItem('id', id, 3600);
        });

        this.socket.on('failure', () => {
            alert('Connection error... please reconnect.');
        });

        this.socket.on('resuccess', (name) => {
            this.setState({msg : `reconnected as ${name} ...`});
            this.setState(() => ({
                registered: true
            }));
            this.playerId = cookie.getItem('id');
        });
        
        if(cookie.hasItem('id')) {
            console.log(`reconnecting as ${cookie.getItem('id')} ...`)
            this.socket.emit('r', cookie.getItem('id'));
        }
    }

    register(){
        if (this.input.value){
            this.socket.emit('register', this.input.value);
            this.setState({registered: true});
            this.input.value = '';
        }
    }

    submitAnswer() {
        if (this.input.value) {
            let payload = {
                id: this.playerId,
                answer: this.input.value
            }
            this.socket.emit('submit', payload);
            this.input.value = '';
        }
    }

    render (){
        const submit = (e) => {
            if (this.state.registered) {
                this.submitAnswer();
                e.preventDefault()
            } else {
                this.register();
                e.preventDefault();
            }
        }
        return (
            <div className="client">
                <div className="msg">{this.state.msg}</div>
                <form className="form" onSubmit={submit}>
                    <input maxLength="30" ref={input => this.input = input}/>
                    <div className="bar"></div>
                </form>
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
                <button onClick={this.state.func} className="ods-button--ghost">
                    {this.state.registered ?
                    "Submit Answer"
                    :"Enter Name"}
                </button>
            </div>
        );
    }
}

export default Client;