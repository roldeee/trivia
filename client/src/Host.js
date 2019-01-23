import React from 'react';
import openSocket from 'socket.io-client';
import PropTypes from 'prop-types';
import axios from 'axios';
import ed from 'edit-distance';

class Timer extends React.Component {
    constructor() {
        super();
        this.state = { 
            seconds: 0,
            on: false
         };
        this.timer = 0;
        this.startTimer = this.startTimer.bind(this);
        this.countDown = this.countDown.bind(this);
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.i >= 0 && this.state.seconds === 0 && !this.state.on && nextProps.i > this.props.i){
            this.startTimer();
        }else if (nextProps.i > this.props.i) {
            this.setState({
                seconds: 30
            })
        }
    }
  
    startTimer() {
        this.setState({
            seconds: 30,
            on: true
        });
        this.timer = setInterval(this.countDown, 1000);
    }
  
    countDown() {
        let seconds = this.state.seconds - 1;
        this.setState({
            seconds: seconds
        });
        if (seconds === 0) { 
            clearInterval(this.timer);
            this.setState({
                on: false
            });
        }
    }
  
    render() {
        if (this.state.seconds > 0 ){
            return( 
                <div>
                    <h2>
                        {this.state.seconds}
                    </h2>
                </div>
            );
        } else {
            return (
                <> </>
            );
        }
    }
}

function Question({ question }) {
  return (
    <div className="question">
      <h1>
        {question}
      </h1>
    </div>
  );
}
Question.propTypes = {
  question: PropTypes.string.isRequired
}

function Answer({ answer }) {
    return (
        <div className="answer">
            <h2>
                {answer}
            </h2>
        </div>
    );
}

function Responses({ responses, toggle }) {
  return(
    <ul className='responses'>
      {responses ? 
      responses.map(response =>
        <li key={response.id}>
            <h3 onClick={() => toggle(response.id)} className={response.correct ? 'correct' : ''}>
                {response.name}: {response.answer}
            </h3>
        </li>)
        :<></>
      }
    </ul>
  );
}
Responses.propTypes = {
  responses: PropTypes.array
}

function Results({ scores }) {
    return (
        <div className='results'>
            <ul>
                {scores ?
                scores.map(score => 
                    <li>
                        <h3>
                            {score[0]}: {score[1]}
                        </h3>
                    </li>
                )
                :<></>
                }
            </ul>
        </div>
    );
}

function Title () {
    return (
        <h1>Trivia One</h1>
    );
}
    
class QuestionButton extends React.Component {
    render() {
        return (
            <button className="btn btn-info" onClick={this.props.qFunction}>Question</button>
        );
    }
}

class AnswerButton extends React.Component{
    render(){
        return (
            <button className="btn btn-secondary" onClick={this.props.aFunction}>Answer</button>
        );
    }
}

class ResponsesButton extends React.Component {
    render () {
        return(
            <button className="btn btn-primary" onClick={this.props.rFunction}>Responses</button>
        );
    };
}

class ResultsButton extends React.Component {
    
    render(){
        return (
            <button onClick={this.props.fFunction} className="btn btn-success" >Results</button>
        );
    }
}

class Host extends React.Component {
    constructor() {
        super();
        this.state = {
          i: -1,
          showAnswer: false
        }
        this.increment = this.increment.bind(this);
        this.showAnswer = this.showAnswer.bind(this);
        this.getResponses = this.getResponses.bind(this);
        this.getResults = this.getResults.bind(this);
        this.toggleCorrect = this.toggleCorrect.bind(this);

        axios.get('https://opentdb.com/api.php?amount=50&category=9&difficulty=medium&type=multiple')
        .then(response => this.parseQuestions(response));
    }

    componentDidMount() {
        this.socket = openSocket();

        this.socket.on('answers', responses => {
            console.log('recieved', responses);
            responses = responses.map(res => {
                return {...res, 
                    correct: this.checkAnswer(res.answer, this.answers[this.state.i])};
            });
            this.setState({responses});
        });
        this.socket.on('results', players => {
            let scores = players.map(player => {
                return [player.name, player.score]
            });
            this.setState({scores});
            console.log(scores);
        });
    }
    
    toggleCorrect(id) {
        let res = this.state.responses.map(r => {
            if (r.id === id){
                r.correct = !r.correct
            }
            return r
        });
        this.setState({responses: res});
        console.log('toggle', res);
    }

    parseQuestions(response) {
        let results = JSON.parse(response.request.response).results;
        this.questions = results.map(r => this.decode(r.question));
        this.answers = results.map(r => this.decode(r.correct_answer));
        this.setState({
            questions: this.questions,
            answers: this.answers
        })
    }

    checkAnswer(s1, s2) {
        let insert, remove, update;
        insert = remove = function(node) { return 1; };
        update = function(stringA, stringB) { return stringA !== stringB ? 1 : 0; };
        let lev = ed.levenshtein(s1, s2, insert, remove, update);
        return lev.distance < 5
    }

    decode(html) {
        let txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    increment() {
        this.socket.emit('score', this.state.responses);
        this.setState(() => {
          return {
            i: this.state.i + 1,
            showAnswer: false,
            responses: []
          }
        });
      }
    
    showAnswer() {
        this.setState(() => {
            return {
                showAnswer: true
            }
        });
    }

    getResponses() {
        console.log('emitted');
        this.socket.emit('answers');
    }

    getResults() {
        this.socket.emit('results');
    }

    render() {
        return (
            <div className="host">
                <Nav i={this.state.i} increment={this.increment} showAnswer={this.showAnswer} getResponses={this.getResponses} getResults={this.getResults}/>
                <Body i={this.state.i} showAnswer={this.state.showAnswer} scores={this.state.scores} responses={this.state.responses} questions={this.state.questions} answers={this.state.answers} toggle={this.toggleCorrect}/>
            </div>
        );
    }
}

class Body extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            i: this.props.i
        }
    }

    componentWillReceiveProps(nextProps){
        this.questions = nextProps.questions;
        this.answers = nextProps.answers;
        this.setState(() => {
            return {
                i: nextProps.i,
                showAnswer: nextProps.showAnswer,
                responses: nextProps.responses,
                scores: nextProps.scores
            }
        });
    }
    
    render(){
        try {
            return (
                <div>
                    {this.state.i > -1 ? 
                    <Question question={this.questions[this.state.i]}/>
                    : <></>}
                    {this.state.i > -1 && this.state.showAnswer?
                    <Answer answer={this.answers[this.state.i]}/>
                    : <></>}
                    <div>
                        <Timer i={this.state.i}/>
                    </div>
                    <Responses toggle={this.props.toggle} responses={this.state.responses}/>
                    <Results scores={this.state.scores} />
                </div>
            );
        }
        catch (e) {
            console.log(e);
            return (
                <div>
                    Error: {e}
                </div>
            );
        }
    }
}

class Nav extends React.Component {

    render () {
        return (
            <div className="jumbotron">
                <Title/>
                <div className="btn-group btn-group-lg" role="group">
                    <QuestionButton qFunction={this.props.increment}/>
                    <AnswerButton aFunction={this.props.showAnswer}/>
                    <ResponsesButton rFunction={this.props.getResponses}/>
                    <ResultsButton fFunction={this.props.getResults}/>
                </div>
                <h2 className="count">
                    {24 - this.props.i}
                </h2>
            </div>
        );
    }
}

export default Host;