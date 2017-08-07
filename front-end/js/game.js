var GameStatus = {
  inProgress: 1,
  gameOver: 2
}

var Game = (function() {
  var canvas = [], context = [], grid = [],
      gridHeight = 450, gridWidth = 450, gridBorder = 1,
      gridRows = 10, gridCols = 10, markPadding = 10, shipPadding = 3,
      squareHeight = (gridHeight - gridBorder * gridRows - gridBorder) / gridRows,
      squareWidth = (gridWidth - gridBorder * gridCols - gridBorder) / gridCols,
      turn = false, gameStatus, squareHover = { x: -1, y: -1 };

  canvas[0] = document.getElementById('myGrid');    // This player
  canvas[1] = document.getElementById('opponentsGrid');    // Opponent
  context[0] = canvas[0].getContext('2d');
  context[1] = canvas[1].getContext('2d');

  check = new Image();
  check.src = 'img/check.png';
  miss = new Image();
  miss.src = 'img/miss.png';
  water = new Image();
  water.src = 'img/water.png';

  //Hover sobre las casillas del tablero del oponente
  canvas[1].addEventListener('mousemove', function(e) {
    var pos = getCanvasCoordinates(e, canvas[1]);
    squareHover = getSquare(pos.x, pos.y);
    drawGrid(1);
  });

  //Quitar el hover
  canvas[1].addEventListener('mouseout', function(e) {
    squareHover = { x: -1, y: -1 };
    drawGrid(1);
  });

  //Elección de la casilla
  canvas[1].addEventListener('click', function(e) {
    if(turn) {
      var pos = getCanvasCoordinates(e, canvas[1]);
      var square = getSquare(pos.x, pos.y);
      sendShot(square);
    }
  });

  //Obtener casilla
  function getSquare(x, y) {
    return {
      x: Math.floor(x / (gridWidth / gridCols)),
      y: Math.floor(y / (gridHeight / gridRows))
    };
  };

  //Obtener posición del cursor
  function getCanvasCoordinates(event, canvas) {
    rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
      y: Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    };
  };

  //Iniciar juego
  function initGame() {
    var i;

    gameStatus = GameStatus.inProgress;
    
    //Crear los tableros
    grid[0] = { shots: Array(gridRows * gridCols), ships: [] };
    grid[1] = { shots: Array(gridRows * gridCols), ships: [] };

    for(i = 0; i < gridRows * gridCols; i++) {
      grid[0].shots[i] = 0;
      grid[1].shots[i] = 0;
    }

    //Reseteo de alertas y estados
    $('#turn-status').removeClass('alert-your-turn').removeClass('alert-opponent-turn')
            .removeClass('alert-winner').removeClass('alert-loser');

    drawGrid(0);
    drawGrid(1);
  };

  //Actualizar tableros
  function updateGrid(player, gridState) {
    grid[player] = gridState;
    drawGrid(player);
  };

  //Asignar turno
  function setTurn(turnState) {
    if(gameStatus !== GameStatus.gameOver) {
      turn = turnState;

      if(turn) {
        $('#turn-status').removeClass('alert-opponent-turn').addClass('alert-your-turn').html('¡ES HORA DE ATACAR!');
      } else {
        $('#turn-status').removeClass('alert-your-turn').addClass('alert-opponent-turn').html('ESPERANDO ATAQUE DEL OPONENTE');
      }
    }
  };

  //Indicar ganador y perdedor
  function setGameOver(isWinner) {
    gameStatus = GameStatus.gameOver;
    turn = false;
    
    if(isWinner) {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
              .addClass('alert-winner').html('¡LOGRASTE HUNDIR AL OPONENTE ANTES QUE ÉL A TI! <a href="#" class="btn-leave-game">JUGAR DE NUEVO</a>.');
    } else {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
              .addClass('alert-loser').html('¡EL ENEMIGO HUNDIÓ TODOS TUS BARCOS! <a href="#" class="btn-leave-game">JUGAR DE NUEVO</a>.');
    }
    $('.btn-leave-game').click(sendLeaveRequest);
  }

  //Dibuja el tablero con las casillas, barcos y escogencias de casillas(disparos)
  function drawGrid(gridIndex) {
    drawSquares(gridIndex);
    drawShips(gridIndex);
    drawMarks(gridIndex);
  };

  //Dibuja la casilla
  function drawSquares(gridIndex) {
    var i, j, squareX, squareY;

    context[gridIndex].fillStyle = '#111111'
    context[gridIndex].fillRect(0, 0, gridWidth, gridHeight);

    for(i = 0; i < gridRows; i++) {
      for(j = 0; j < gridCols; j++) {
        squareX = j * (squareWidth + gridBorder) + gridBorder;
        squareY = i * (squareHeight + gridBorder) + gridBorder;

        context[gridIndex].fillStyle = '#3B93CE' //color del "agua"

        //Hover sobre la casilla a escoger
        if(j === squareHover.x && i === squareHover.y &&
                gridIndex === 1 && grid[gridIndex].shots[i * gridCols + j] === 0 && turn) {
          context[gridIndex].fillStyle = '#2471A3';
        }

        context[gridIndex].fillRect(squareX, squareY, squareWidth, squareHeight);
        context[gridIndex].drawImage(water, squareX, squareY,40,40);
      }
    }
  };

  //Dibuja los barcos en el tablero
  function drawShips(gridIndex) {
    var ship, i, x, y,
        shipWidth, shipLength;

    context[gridIndex].fillStyle = '#222222';
    
    for(i = 0; i < grid[gridIndex].ships.length; i++) {
      ship = grid[gridIndex].ships[i];

      x = ship.x * (squareWidth + gridBorder) + gridBorder + shipPadding;
      y = ship.y * (squareHeight + gridBorder) + gridBorder + shipPadding;
      shipWidth = squareWidth - shipPadding * 2;
      shipLength = squareWidth * ship.size + (gridBorder * (ship.size - 1)) - shipPadding * 2;

      if(ship.horizontal) {
        context[gridIndex].fillRect(x, y, shipLength, shipWidth);
      } else {
        context[gridIndex].fillRect(x, y, shipWidth, shipLength);
      }
    }
  };
  
  //Dibuja X si falla y el boom rojo si acierta
  function drawMarks(gridIndex) {
    var i, j, squareX, squareY;

    for(i = 0; i < gridRows; i++) {
      for(j = 0; j < gridCols; j++) {
        squareX = j * (squareWidth + gridBorder) + gridBorder;
        squareY = i * (squareHeight + gridBorder) + gridBorder;

        if(grid[gridIndex].shots[i * gridCols + j] === 1) {   //Dibuja el fallo
          context[gridIndex].drawImage(miss, squareX, squareY,40,40);
        }
        
        else if(grid[gridIndex].shots[i * gridCols + j] === 2) {   //Dibuja el acierto       
          context[gridIndex].drawImage(check, squareX, squareY,40,40);
        }
      }
    }
  };

  return {
    'initGame': initGame,
    'updateGrid': updateGrid,
    'setTurn': setTurn,
    'setGameOver': setGameOver
  };
})();
