var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

var BattleshipGame = require('./back-end/game.js');
var GameStatus = require('./back-end/gameStatus.js');
var port = 9999;
var users = {};
var gameIdCounter = 1;

app.use(express.static(__dirname + '/front-end'));

http.listen(port, function(){
  console.log('Esperando en el puerto:' + port);
});

io.on('connection', function(socket) {
  console.log((' Socket: ' + socket.id + ' conectado.'));

  //Crear datos del usuario
  users[socket.id] = {
    inGame: null,
    player: null
  }; 

  //Mostrar pantalla de espera en caso de que no haya ningún jugador esperando
  socket.join('waiting room');

  //Manejar las posiciones que escoje el jugador para hundir los barcos
  socket.on('shot', function(position) {
    var game = users[socket.id].inGame, opponent;

    if(game !== null) {
      
      if(game.currentPlayer === users[socket.id].player) {  //Pregunta si es el turno del jugador
        opponent = game.currentPlayer === 0 ? 1 : 0;

        if(game.shoot(position)) {
          checkGameOver(game);

          //Actualiza los tableros de ambos jugadores
          io.to(socket.id).emit('update', game.getGameState(users[socket.id].player, opponent));
          io.to(game.getPlayerId(opponent)).emit('update', game.getGameState(opponent, opponent));
        }
      }
    }
  });
  
  //Cuando se termina el juego
  socket.on('leave', function() {
    if(users[socket.id].inGame !== null) {
      leaveGame(socket);
      socket.join('waiting room');
      joinWaitingPlayers();
    }
  });

  //Cuando se cierra el juego en pleno juego
  socket.on('disconnect', function() {
  console.log((' Socket: ' + socket.id + ' desconectado.'));
    
    leaveGame(socket);
    delete users[socket.id];
  });

  joinWaitingPlayers();

});

//"Crea" los 2 jugadores
function joinWaitingPlayers() {
  var players = getClientsInRoom('waiting room');
  
  if(players.length >= 2) {   //Si hay 2 jugadores, muestre el juego

    var game = new BattleshipGame(gameIdCounter++, players[0].id, players[1].id);

    players[0].leave('waiting room');
    players[1].leave('waiting room');
    players[0].join('game' + game.id);
    players[1].join('game' + game.id);

    users[players[0].id].player = 0;
    users[players[1].id].player = 1;
    users[players[0].id].inGame = game;
    users[players[1].id].inGame = game;
    
    io.to('game' + game.id).emit('join', game.id);

    //Coloca los barcos aleatoriamente
    io.to(players[0].id).emit('update', game.getGameState(0, 0));
    io.to(players[1].id).emit('update', game.getGameState(1, 1));

    console.log((players[0].id + " y " + players[1].id + " inician el juego " + game.id));
  }
}

//Salida del juego
function leaveGame(socket) {
  if(users[socket.id].inGame !== null) {
    console.log((' ID ' + socket.id + ' dejó el juego # ' + users[socket.id].inGame.id));

    //Envia el mensaje al oponente
    socket.broadcast.to('game' + users[socket.id].inGame.id).emit('notification', {
      message: 'Su oponente ha dejado el juego'
    });

    if(users[socket.id].inGame.gameStatus !== GameStatus.gameOver) {
      users[socket.id].inGame.abortGame(users[socket.id].player);
      checkGameOver(users[socket.id].inGame);
    }

    socket.leave('game' + users[socket.id].inGame.id);

    users[socket.id].inGame = null;
    users[socket.id].player = null;

    io.to(socket.id).emit('leave');
  }
}

//Notifica el fin del juego
function checkGameOver(game) {
  if(game.gameStatus === GameStatus.gameOver) {
    console.log((new Date().toISOString()) + ' Juego # ' + game.id + ' finalizado.');
    io.to(game.getWinnerId()).emit('gameover', true);
    io.to(game.getLoserId()).emit('gameover', false);
  }
}

//Obtiene los sockets iniciados (jugadores)
function getClientsInRoom(room) {
  var clients = [];
  for (var id in io.sockets.adapter.rooms[room]) {
    clients.push(io.sockets.adapter.nsp.connected[id]);
  }
  return clients;
}
