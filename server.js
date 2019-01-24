'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use(express.static(path.join(__dirname, 'client/build')))
  .get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/client/build/index.html'))
  })
  // .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

let players = {};
let answers = [];

io.on('connection', function(socket) {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        delete players[socket.id];
    });

    socket.on('register', name => {
        const id = socket.id;
        players[id] = {name, score: 0};
        socket.emit('success', id);
        console.log(`${name}(${id}) has registered`);
    });

    socket.on('submit', payload => {
        const id = payload.id;
        const name = players[payload.id].name;
        console.log(`${name} answered: ${payload.answer}`);
        answers.push({id, name, answer: payload.answer})
    });

    socket.on('answers', () => {
        console.log('answers request recieved')
        socket.emit('answers', answers)
    });

    socket.on('score', score);

    socket.on('results', (responses) => {
        score(responses);
        let scores = Object.entries(players).map(player => player[1]);
        socket.emit('results', scores);
    });
})

function score(responses) {
    responses = responses ? responses : []
    for(let res of responses) {
        if (res.correct){
            players[res.id].score += 1
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
