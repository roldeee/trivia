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
            return( 
                    <h2>
                        {this.state.seconds} s
                    </h2>
            );
    }
}

function Question({ question, click }) {
  return (
    <div onClick={click} className="question">
      <h1>
        {question}
      </h1>
    </div>
  );
}
Question.propTypes = {
  question: PropTypes.string.isRequired
}

function Category({ category }) {
    return (
        <h1 className="category">
            {category}
        </h1>
    );
}

function Points({ points }) {
    return (
        <h1>
            {points || 'No point value assigned ☹️'}
        </h1>
    );
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

function AllAnswers({ answers }) {
    function shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
    shuffle(answers);
    return (
        <div className="choices">
            <ul>
                {answers.map((ans) => <li><h3>{ans}</h3></li>)}
            </ul>
        </div>
    )
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
    if (scores) {
        scores.sort((a, b) => b[1] - a[1]);
    }
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
        <div className="title">
            <h1>Trivia One</h1>
        </div>
    );
}
    
function QuestionButton({ qFunction }) {
    return (
        <button className="ods-button--ghost" onClick={qFunction}>Question</button>
    );
}

function AnswerButton({ aFunction }) {
    return (
        <button className="ods-button--ghost" onClick={aFunction}>Answer</button>
    );
}

function ResponsesButton({ rFunction }) {
    return(
        <button className="ods-button--ghost" onClick={rFunction}>Responses</button>
    );
}

function ResultsButton({ fFunction }) {
    return (
        <button onClick={fFunction} className="ods-button--ghost" >Results</button>
    );
}

class Host extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          i: -1,
          showAnswer: false,
          multipleChoice: false,
          n: -1,
          qr: false
        }
        this.increment = this.increment.bind(this);
        this.showAnswer = this.showAnswer.bind(this);
        this.getResponses = this.getResponses.bind(this);
        this.getResults = this.getResults.bind(this);
        this.toggleCorrect = this.toggleCorrect.bind(this);
        this.toggleQR = this.toggleQR.bind(this);
        this.showMultipleChoice = this.showMultipleChoice.bind(this);

        this.j = props.j;

        let jAPI = 'http://jservice.io/api/random?count=50';
        let tAPI = 'https://opentdb.com/api.php?amount=50&type=multiple';

        axios.get(this.j ? jAPI : tAPI)
        .then(response => this.parseQuestions(response));
    }

    componentDidMount() {
        this.socket = openSocket();

        this.socket.on('answers', responses => {
            if (this.j) {
                responses = responses.map(res => {
                    return {...res, 
                        correct: this.checkAnswer(res.answer.toLowerCase(), this.answers[this.state.i].toLowerCase()),
                        points: this.values[this.state.i]
                    };
                });
            } else {
                responses = responses.map(res => {
                    return {...res, 
                        correct: this.checkAnswer(res.answer.toLowerCase(), this.answers[this.state.i].toLowerCase())};
                });
            }
            console.log('recieved', responses);
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

    toggleQR() {
        this.setState({ qr: !this.state.qr });
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
        if (this.j){
            let results = response.data.filter(r => r.value);
            console.log(results);
            this.questions = results.map(r => r.question);
            this.answers = results.map(r => r.answer);
            this.categories = results.map(r => r.category.title);
            this.values = results.map(r => r.value);
            console.log(this.questions, this.answers, this.categories);
            this.setState({
                questions: this.questions,
                answers: this.answers,
                categories: this.categories,
                values: this.values
            });
        } else {
            let results = JSON.parse(response.request.response).results;
            console.log(results);
            this.questions = results.map(r => this.decode(r.question));
            this.answers = results.map(r => this.decode(r.correct_answer));
            this.choices = results.map(r => r.incorrect_answers.concat(r.correct_answer).map(this.decode));
            this.setState({
                questions: this.questions,
                answers: this.answers
            });
            console.log(this.questions, this.answers);
        }
    }

    // TODO: Fix this alg. No es good! :(
    checkAnswer(s1, s2) {
        // let insert, remove, update;
        // insert = remove = function(node) { return 1; };
        // update = function(stringA, stringB) { return stringA !== stringB ? 1 : 0; };
        // let lev = ed.levenshtein(s1, s2, insert, remove, update);
        return s1 === s2;
    }

    decode(html) {
        let txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    increment() {
        console.log(this.state.responses);
        this.socket.emit('score', this.state.responses);
        this.setState(() => {
          return {
            n: this.state.n + 1,
            showAnswer: false,
            multipleChoice: false,
            responses: []
          }
        });
      }
    
    showAnswer() {
        this.setState(() => {
            return {
                i: this.state.i + 1,
                showAnswer: true,
                multipleChoice: false
            }
        });
    }

    showMultipleChoice() {
        const temp = this.state.multipleChoice;
        console.log(temp);
        this.setState(() => {
            return {
                multipleChoice: !temp
            }
        });
    }

    getResponses() {
        console.log('emitted');
        this.socket.emit('answers');
    }

    getResults() {
        this.socket.emit('results', this.state.responses);
        this.setState(() => {
            return {
              showAnswer: false,
              responses: []
            }
          });
    }

    render() {
        return (
            <div className="host">
                <div className="half1">
                    <h2 className="count">
                        {24 - this.state.i} questions left
                    </h2>
                </div>
                <div className="half1" onClick={this.toggleQR}>
                    <h1>
                        c1-trivia.herokuapp.com
                    </h1>
                </div>
                <div className="half2">
                    <div className={"timer"}>
                        <div className={(this.state.showAnswer ? "invis" : "")}>
                            <Timer i={this.state.n} />
                        </div>
                    </div>
                </div>
                {this.state.qr ? 
                <img src="frame.png" alt="QR Code"/> :
                <></>}
                <div>
                    {this.state.n < 0 &&
                    <Title/> 
                    }
                    {this.state.n > -1 &&
                    <div> 
                        {this.j && 
                        <>
                            <Category category={this.state.categories[this.state.n]}/>
                            <Points points={this.state.values[this.state.n]}/>
                        </>
                        }
                        <Question click={this.j ? null : this.showMultipleChoice } question={this.state.questions[this.state.n]}/>
                    </div>
                    }
                    {this.state.n > -1 && this.state.showAnswer &&
                    <Answer answer={this.answers[this.state.n]}/>
                    }
                    {this.state.n > -1 && this.state.multipleChoice &&
                    <AllAnswers answers={this.choices[this.state.n]}/>
                    }
                    <Responses toggle={this.toggleCorrect} responses={this.state.responses}/>
                    <Results scores={this.state.scores} />
                </div>
                <div className="nav">
                    <div className="buttons">
                        <QuestionButton qFunction={this.increment}/>
                        <AnswerButton aFunction={this.showAnswer}/>
                        <ResponsesButton rFunction={this.getResponses}/>
                        <ResultsButton fFunction={this.getResults}/>
                    </div>
                </div>
            </div>
        );
    }
}


export default Host;