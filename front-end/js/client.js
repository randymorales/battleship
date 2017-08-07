var socket = io();

$(function() {

  //Conectado exitosamente al servidor
  socket.on('connect', function() {
    console.log('Conectado al servidor.');
    $('#disconnected').hide();
    $('#waiting-room').show();   
  });

  //Desconectado del servidor
  socket.on('disconnect', function() {
    console.log('Desconectado del servidor.');
    $('#waiting-room').hide();
    $('#').hide();
    $('#disconnected').show();
  });

  //Un jugador se conectó
  socket.on('join', function() {
    Game.initGame();
    $('#disconnected').hide();
    $('#waiting-room').hide();
    $('#game').show();
  });

  //Actualiza el estado del juego
  socket.on('update', function(gameState) {
    Game.setTurn(gameState.turn);
    Game.updateGrid(gameState.gridIndex, gameState.grid);
  });

  //Finaliza el juego
  socket.on('gameover', function(isWinner) {
    Game.setGameOver(isWinner);
  });
  
  //Deja el juego y muestra la pantalla de espera
  socket.on('leave', function() {
    $('#game').hide();
    $('#waiting-room').show();
  });

});

//Solicita salir del juego
function sendLeaveRequest(e) {
  e.preventDefault();
  socket.emit('leave');
}

//Envia la posicion elegida del "disparo" al servidor
function sendShot(square) {
  socket.emit('shot', square);
}