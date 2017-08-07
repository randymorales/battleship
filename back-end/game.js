var Player = require('./player.js');
var Settings = require('./settings.js');
var GameStatus = require('./gameStatus.js');

//Constructor
function BattleshipGame(id, idPlayer1, idPlayer2) {
  this.currentPlayer = Math.floor(Math.random() * 2);
  this.winningPlayer = null;
  this.gameStatus = GameStatus.inProgress;
  this.players = [new Player(idPlayer1), new Player(idPlayer2)];
}

//Obtiene el id del socket
BattleshipGame.prototype.getPlayerId = function(player) {
  return this.players[player].id;
};

//Obtiene el id del socket del ganador
BattleshipGame.prototype.getWinnerId = function() {
  if(this.winningPlayer === null) {
    return null;
  }
  return this.players[this.winningPlayer].id;
};

//Obtiene el id del socket del perdedor
BattleshipGame.prototype.getLoserId = function() {
  if(this.winningPlayer === null) {
    return null;
  }
  var loser = this.winningPlayer === 0 ? 1 : 0;
  return this.players[loser].id;
};

//Cambio de turno
BattleshipGame.prototype.switchPlayer = function() {
  this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
};

//Salir del juego. Da como ganador al oponente
BattleshipGame.prototype.abortGame = function(player) {
  this.gameStatus = GameStatus.gameOver;
  this.winningPlayer = player === 0 ? 1 : 0;
}

//Eleccion de "disparo" del jugador
//position lleva el x y el y
//retorna true en caso de ser un movimiento válido
BattleshipGame.prototype.shoot = function(position) {
  var opponent = this.currentPlayer === 0 ? 1 : 0,
      gridIndex = position.y * Settings.gridCols + position.x;

  if(this.players[opponent].shots[gridIndex] === 0 && this.gameStatus === GameStatus.inProgress) {  //Si la posición no ha sido elegida
    if(!this.players[opponent].shoot(gridIndex)) {  // Si falla
      this.switchPlayer();
    }

    //Revisa si ya se acabó el juego
    if(this.players[opponent].getShipsLeft() <= 0) {
      this.gameStatus = GameStatus.gameOver;
      this.winningPlayer = opponent === 0 ? 1 : 0;
    }
    
    return true;
  }

  return false;
};

//Ver el estado del juego (Un jugador)
//player es quien va a recibir la actualizacion
//gridOwner es quien envía la actualización
BattleshipGame.prototype.getGameState = function(player, gridOwner) {
  return {
    turn: this.currentPlayer === player,                 // verifica si es mi turno
    gridIndex: player === gridOwner ? 0 : 1,             // cuál grid se actualiza?(0 = mío, 1 = oponente)
    grid: this.getGrid(gridOwner, player !== gridOwner)  // esconde los barcos si es el grid del oponente
  };
};

//Obtiene el juego de un jugador (el grid)
//player es quien envía el grid
// hideShips para saber cuando ocultar el juego (los barcos)
BattleshipGame.prototype.getGrid = function(player, hideShips) {
  return {
    shots: this.players[player].shots,
    ships: hideShips ? this.players[player].getSunkShips() : this.players[player].ships
  };
};

module.exports = BattleshipGame;
