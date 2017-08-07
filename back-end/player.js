var Ship = require('./ship.js');
var Settings = require('./settings.js');

//Constructor. id = socket
function Player(id) {
  var i;
  
  this.id = id;
  this.shots = Array(Settings.gridRows * Settings.gridCols);
  this.shipGrid = Array(Settings.gridRows * Settings.gridCols);
  this.ships = [];

  for(i = 0; i < Settings.gridRows * Settings.gridCols; i++) {
    this.shots[i] = 0;
    this.shipGrid[i] = -1;
  }

  //Crea y coloca los barcos aleatoriamente
  if(!this.createRandomShips()) {
    this.ships = [];
    this.createShips();
  }
};

//Elección de una casilla. True si adivina
Player.prototype.shoot = function(gridIndex) {

  if(this.shipGrid[gridIndex] >= 0) {    // Si adivina una casilla

    this.ships[this.shipGrid[gridIndex]].hits++;
    this.shots[gridIndex] = 2;
    return true;

  } else {    //si falla
    this.shots[gridIndex] = 1;
    return false;
  }
};

//Obtiene la lista de barcos hundidos
Player.prototype.getSunkShips = function() {
  var i, sunkShips = [];

  for(i = 0; i < this.ships.length; i++) {
    if(this.ships[i].isSunk()) {
      sunkShips.push(this.ships[i]);
    }
  }

  return sunkShips;
};

//Numero de barcos eliminados
Player.prototype.getShipsLeft = function() {
  var i, shipCount = 0;

  for(i = 0; i < this.ships.length; i++) {
    if(!this.ships[i].isSunk()) {
      shipCount++;
    }
  }

  return shipCount;
}

//Crea los barcos y los posiciona aleatoriamente
Player.prototype.createRandomShips = function() {

  var shipIndex;

  for(shipIndex = 0; shipIndex < Settings.ships.length; shipIndex++) {
    ship = new Ship(Settings.ships[shipIndex]);
  
    if(!this.placeShipRandom(ship, shipIndex)) {
      return false;
    }

    this.ships.push(ship);
  }
  
  return true;
};

//Verifica que no "caigan encima" los barcos en las casillas. True si lo coloca sin problema
Player.prototype.placeShipRandom = function(ship, shipIndex) {
  var i, j, gridIndex, xMax, yMax, tryMax = 25;

  for(i = 0; i < tryMax; i++) {
    ship.horizontal = Math.random() < 0.5;

    xMax = ship.horizontal ? Settings.gridCols - ship.size + 1 : Settings.gridCols;
    yMax = ship.horizontal ? Settings.gridRows : Settings.gridRows - ship.size + 1;

    ship.x = Math.floor(Math.random() * xMax);
    ship.y = Math.floor(Math.random() * yMax);

    if(!this.checkShipOverlap(ship) && !this.checkShipAdjacent(ship)) { //Si no choca con otro en el tablero, lo coloca
      gridIndex = ship.y * Settings.gridCols + ship.x;
      for(j = 0; j < ship.size; j++) {
        this.shipGrid[gridIndex] = shipIndex;
        gridIndex += ship.horizontal ? 1 : Settings.gridCols;
      }
      return true;
    }
  }
  
  return false;
}

//Verifica si el barco "cae encima"
Player.prototype.checkShipOverlap = function(ship) {
  var i, gridIndex = ship.y * Settings.gridCols + ship.x;

  for(i = 0; i < ship.size; i++) {
    if(this.shipGrid[gridIndex] >= 0) {
      return true;
    }
    gridIndex += ship.horizontal ? 1 : Settings.gridCols;
  }

  return false;
}

//Verfica si hay barcos adyacentes al colocar
Player.prototype.checkShipAdjacent = function(ship) {
  var i, j,
      x1 = ship.x - 1,
      y1 = ship.y - 1,
      x2 = ship.horizontal ? ship.x + ship.size : ship.x + 1,
      y2 = ship.horizontal ? ship.y + 1 : ship.y + ship.size;

  for(i = x1; i <= x2; i++) {

    if(i < 0 || i > Settings.gridCols - 1) continue;

    for(j = y1; j <= y2; j++) {

      if(j < 0 || j > Settings.gridRows - 1) continue;

      if(this.shipGrid[j * Settings.gridCols + i] >= 0) {
        return true;
      }
    }
  }

  return false;
}

//Crear los barcos aleatoriamente
Player.prototype.createShips = function() {
  var i, shipIndex, gridIndex, ship,
      x = [1, 3, 5, 8, 8], y = [1, 2, 5, 2, 8],
      horizontal = [false, true, false, false, true];

  for(shipIndex = 0; shipIndex < Settings.ships.length; shipIndex++) {
    ship = new Ship(Settings.ships[shipIndex]);
    ship.horizontal = horizontal[shipIndex];
    ship.x = x[shipIndex];
    ship.y = y[shipIndex];

    // coloca el barco en las posiciones
    gridIndex = ship.y * Settings.gridCols + ship.x;
    for(i = 0; i < ship.size; i++) {
      this.shipGrid[gridIndex] = shipIndex;
      gridIndex += ship.horizontal ? 1 : Settings.gridCols;
    }

    this.ships.push(ship);
  }
};

module.exports = Player;
