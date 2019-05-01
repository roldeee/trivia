'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = express()
  .use(express.static(path.join(__dirname, 'client/build')))
  .get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/client/build/index.html'))
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

let players = {};
let answers = {};

io.on('connection', function(socket) {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('register', name => {
        try{
            const id = socket.id;
            players[id] = {name, score: 0};
            socket.emit('success', id);
            console.log(`${name}(${id}) has registered`);
        }
        catch (e) {
            console.error("Registration error...");
            socket.emit("failure");
        }
    });

    socket.on('r', id => {
        if (players[id]) {
            socket.emit('resuccess', players[id].name);
            console.log(`Client reconnected as ${players[id].name}`);
        }
    });

    socket.on('submit', payload => {
        try {
            const id = payload.id;
            const name = players[payload.id].name;
            console.log(`${name} answered: ${payload.answer}`);
            answers[id] = {id, name, answer: payload.answer};
        }
        catch (e) {
            console.error("Connection error...");
            socket.emit('failure');
        }
    });

    socket.on('answers', () => {
        console.log('answers request recieved')
        socket.emit('answers', Object.values(answers))
    });

    socket.on('score', score);

    socket.on('results', (responses) => {
        try{
            score(responses);
            let scores = Object.entries(players).map(player => player[1]);
            socket.emit('results', scores);
            clearPlayers();
        }
        catch (e) {
            console.error("Scoring error...")
        }
    });
})

function clearPlayers() {
    players = {};
    answers = {};
}

function score(responses) {
    responses = responses ? responses : [];
    for(let res of responses) {
        if (res.correct){
            if (res.points) {
                players[res.id].score += +res.points;
            } else {
                players[res.id].score += 1;
            }
        }
    }
    answers = [];
}

if (!Object.entries) {
    Object.entries = function( obj ){
      var ownProps = Object.keys( obj ),
          i = ownProps.length,
          resArray = new Array(i); // preallocate the Array
      while (i--)
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
      
      return resArray;
    };
  }
