import React, { Component } from 'react';
import cs from 'classnames';
import {Grid, AStarFinder} from 'pathfinding';

import './App.css';

const TICK_RATE = 100;
const GRID_SIZE = 35;
const GRID = [];
let pfGrid;
let finder = new AStarFinder();
let path = [];
let nextPos;

for (let i = 0; i <= GRID_SIZE; i++) {
  GRID.push(i);
}

// console.log('grid', pfGrid);
const generateNewFinderGrid = () => {
  pfGrid = null;
  pfGrid = new Grid(GRID_SIZE, GRID_SIZE);
  
  for (let i = 0; i < GRID_SIZE-1; i++) {
    for (let j = 0; j < GRID_SIZE-1; j++) {
      if (i == 0 || j == 0 || i == GRID_SIZE-1 || j == GRID_SIZE-1) pfGrid.setWalkableAt(i, j, false);
    }
  }
};

const resetGridWalkableFields = (prevState) => {
  generateNewFinderGrid();
  // console.log('prevstate', prevState, pfGrid);
  prevState.snake.coordinates.forEach((coordinate) => {
    // console.log('coordinate',coordinate);
    pfGrid.setWalkableAt(coordinate.x, coordinate.y, false);
  });
};

generateNewFinderGrid();

const DIRECTIONS = {
  UP: 'UP',
  BOTTOM: 'BOTTOM',
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
};

const DIRECTION_TICKS = {
  UP: (x, y) => ({ x, y: y - 1 }),
  BOTTOM: (x, y) => ({ x, y: y + 1 }),
  RIGHT: (x, y) => ({ x: x + 1, y }),
  LEFT: (x, y) => ({ x: x - 1, y }),
};

const KEY_CODES_MAPPER = {
  38: 'UP',
  39: 'RIGHT',
  37: 'LEFT',
  40: 'BOTTOM',
};

const KEY_CODES_MAPPER_OTHER_COMMAND = {
  82: 'reset'
}

const getRandomNumberFromRange = (min, max) =>
Math.floor(Math.random() * (max - min +1 ) + min);

const getRandomCoordinate = () =>
({
  x: getRandomNumberFromRange(1, GRID_SIZE - 1),
  y: getRandomNumberFromRange(1, GRID_SIZE - 1),
});

const isBorder = (x, y) =>
x === 0 || y === 0 || x === GRID_SIZE || y === GRID_SIZE;

const isPosition = (x, y, diffX, diffY) =>
x === diffX && y === diffY;

const isSnake = (x, y, snakeCoordinates) =>
snakeCoordinates.filter(coordinate => isPosition(coordinate.x, coordinate.y, x, y)).length;

const getSnakeHead = (snake) =>
snake.coordinates[0];

const getSnakeWithoutStub = (snake) =>
snake.coordinates.slice(0, snake.coordinates.length - 1);

const getSnakeTail = (snake) =>
snake.coordinates.slice(1);

const getIsSnakeOutside = (snake) =>
getSnakeHead(snake).x >= GRID_SIZE ||
getSnakeHead(snake).y >= GRID_SIZE ||
getSnakeHead(snake).x <= 0 ||
getSnakeHead(snake).y <= 0;

const getIsSnakeClumy = (snake) =>
isSnake(getSnakeHead(snake).x, getSnakeHead(snake).y, getSnakeTail(snake));

const getIsSnakeEating = ({ snake, snack }) =>
isPosition(getSnakeHead(snake).x, getSnakeHead(snake).y, snack.coordinate.x, snack.coordinate.y);

const getCellCs = (isGameOver, snake, snack, x, y) =>
cs(
  'grid-cell',
  {
    'grid-cell-border': isBorder(x, y),
    'grid-cell-snake': isSnake(x, y, snake.coordinates),
    'grid-cell-snack': isPosition(x, y, snack.coordinate.x, snack.coordinate.y),
    'grid-cell-hit': isGameOver && isPosition(x, y, getSnakeHead(snake).x, getSnakeHead(snake).y),
  }
);

const setNewPosition = (snakeHead, snackCoordinate) => {
  // console.log("before path", path.length, path.length == 0);
  path = (path.length == 0) 
  ? finder.findPath(snakeHead.x, snakeHead.y, 
    snackCoordinate.x, snackCoordinate.y, pfGrid) 
    : path;
    // console.log('after path', path);
    
    nextPos = path.shift();
    if (!nextPos || (nextPos[0] == snakeHead.x && nextPos[1] == snakeHead.y)) {
      nextPos = setNewPosition(snakeHead, snackCoordinate);
    }
    
    return nextPos;
  }
  
  const applySnakePosition = (prevState) => {
    const isSnakeEating = getIsSnakeEating(prevState);
    
    let snakeHead = {
      x: getSnakeHead(prevState.snake).x,
      y: getSnakeHead(prevState.snake).y
    };
    
    let snakeTail = getSnakeWithoutStub(prevState.snake);
    let snackCoordinate = prevState.snack.coordinate;
    // console.log('snakeTail', snakeTail);
    if (isSnakeEating) {
      snakeTail = prevState.snake.coordinates;
      snackCoordinate = getRandomCoordinate();
      while (isSnake(snackCoordinate.x, snackCoordinate.y, prevState.snake.coordinates)) {
        snackCoordinate = getRandomCoordinate();
      }
    }
    if (isSnakeEating) {
      // console.info('-------------------- eating ------------------------');
      path = [];  
    }
    resetGridWalkableFields(prevState);
    // console.log("snakeHead", snakeHead, 'snackCoordinate', snackCoordinate);
    
    // console.log("nextPos before if", nextPos);
    nextPos = setNewPosition(snakeHead, snackCoordinate);
    // console.log("nextPos", nextPos);
    // console.log('after pose path', path);
    snakeHead = {
      x:nextPos[0],
      y: nextPos[1]
    }
    // console.log('new snake head', snakeHead);
    
    
    return {
      snake: {
        coordinates: [snakeHead, ...snakeTail],
      },
      snack: {
        coordinate: snackCoordinate,
      },
      score: isSnakeEating ? prevState.score + 1 : prevState.score
    };
  };
  
  const applyGameOver = (prevState) => ({
    playground: {
      isGameOver: true
    },
  });
  
  const doChangeDirection = (direction) => () => ({
    playground: {
      direction,
    },
  });
  
  const resetGame = () => ({
    playground: {
      direction: DIRECTIONS.RIGHT,
      isGameOver: false,
    },
    snake: {
      coordinates: [getRandomCoordinate()],
    },
    snack: {
      coordinate: getRandomCoordinate(),
    },
    score: 0,
  });
  
  class App extends Component {
    constructor(props) {
      super(props);
      
      this.state = {
        playground: {
          direction: DIRECTIONS.RIGHT,
          isGameOver: false,
        },
        snake: {
          coordinates: [getRandomCoordinate()],
        },
        snack: {
          coordinate: getRandomCoordinate(),
        },
        score: 0,
      };
    }
    
    componentDidMount() {
      this.interval = setInterval(this.onTick, TICK_RATE);
      
      window.addEventListener('keyup', this.onChangeDirection, false);
    }
    
    componentWillUnmount() {
      clearInterval(this.interval);
      
      window.removeEventListener('keyup', this.onChangeDirection, false);
    }
    
    onChangeDirection = (event) => {
      if (KEY_CODES_MAPPER[event.keyCode]) {
        this.setState(doChangeDirection(KEY_CODES_MAPPER[event.keyCode]));
      } else if (KEY_CODES_MAPPER_OTHER_COMMAND[event.keyCode]) {
        this.setState(resetGame);
      }
    }
    
    onTick = () => {
      getIsSnakeOutside(this.state.snake) || getIsSnakeClumy(this.state.snake)
      ? this.setState(applyGameOver)
      : this.setState(applySnakePosition);
    }
    
    render() {
      const {
        snake,
        snack,
        playground,
        score,
      } = this.state;
      
      return (
        <div className="app">
        <h1>Snake! {score}</h1>
        {playground.isGameOver ? <GameOver/> : ''}
        <GridMap
        snake={snake}
        snack={snack}
        isGameOver={playground.isGameOver}
        />
        <audio controls autoPlay id="tetris-mp3">
        <source src="tetris.mp3" type="audio/mpeg"/>
        Your browser does not support the audio element.
        </audio>
        </div>
      );
    }
  }
  
  const GameOver = () => 
  <div className="game-over-title">
  You loose shitty player, type "R" to reload hihi !
  </div>
  
  const GridMap = ({ isGameOver, snake, snack }) =>
  <div>
  {GRID.map(y =>
    <Row
    y={y}
    key={y}
    snake={snake}
    snack={snack}
    isGameOver={isGameOver}
    />
  )}
  </div>
  
  const Row = ({ isGameOver, snake, snack, y }) =>
  <div className="grid-row">
  {GRID.map(x =>
    <Cell
    x={x}
    y={y}
    key={x}
    snake={snake}
    snack={snack}
    isGameOver={isGameOver}
    />
  )}
  </div>
  
  const Cell = ({ isGameOver, snake, snack, x, y }) =>
  <div className={getCellCs(isGameOver, snake, snack, x, y)} />
  
  export default App;