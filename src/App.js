import React, { Component } from 'react';
import cs from 'classnames';

import './App.css';
import Agent from './brain/Agent';

var agent = new Agent();

const TICK_RATE = 100;
const GRID_SIZE = 35;
const GRID = [];

for (let i = 0; i <= GRID_SIZE; i++) {
  GRID.push(i);
}

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

const applySnakePosition = (prevState) => {
  const isSnakeEating = getIsSnakeEating(prevState);

  const snakeHead = DIRECTION_TICKS[prevState.playground.direction](
    getSnakeHead(prevState.snake).x,
    getSnakeHead(prevState.snake).y,
  );

  let snakeTail = getSnakeWithoutStub(prevState.snake);

  let snackCoordinate = prevState.snack.coordinate;

  if (isSnakeEating) {
    snakeTail = prevState.snake.coordinates;
    snackCoordinate = getRandomCoordinate();
    while (isSnake(snackCoordinate.x, snackCoordinate.y, prevState.snake.coordinates)) {
      snackCoordinate = getRandomCoordinate();
    }
  }

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
      lastScore: 0,
      conf: null,
      agentDecision: "",
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

      if(this.state.configuration !== null && this.state.score > this.state.lastScore){
        console.log("add");
        let key = this.state.agentDecision;
        //agent.trainWhileRunning(this.state.configuration, {key: 1});
        this.setState({lastScore: this.state.score})
      }
      //console.log("prendre une decision: ", getSnakeHead(this.state.snake), " snackCoordinate: ", this.state.snack.coordinate, " direction: ", this.state.playground.direction);
      this.setState({configuration: {
          "sx": this.state.snack.coordinate.x,
          "sy": this.state.snack.coordinate.y,
          "hx": getSnakeHead(this.state.snake).x,
          "hy": getSnakeHead(this.state.snake).y,
          "rwall": (getSnakeHead(this.state.snake).x + 1) >= GRID_SIZE ? 1 : 0,
          "rbody": isSnake(getSnakeHead(this.state.snake).x+1,getSnakeHead(this.state.snake).y, this.state.snake.coordinates) ? 1 : 0,
          "lwall": (getSnakeHead(this.state.snake).x - 1) <= 0 ? 1 : 0,
          "lbody": isSnake(getSnakeHead(this.state.snake).x-1,getSnakeHead(this.state.snake).y, this.state.snake.coordinates) ? 1 : 0,
          "uwall": (getSnakeHead(this.state.snake).y - 1) <= 0 ? 1 : 0,
          "ubody": isSnake(getSnakeHead(this.state.snake).x,getSnakeHead(this.state.snake).y-1, this.state.snake.coordinates) ? 1 : 0,
          "dwall": (getSnakeHead(this.state.snake).y + 1) >= GRID_SIZE ? 1 : 0,
          "dbody": isSnake(getSnakeHead(this.state.snake).x,getSnakeHead(this.state.snake).y+1, this.state.snake.coordinates) ? 1 : 0
        }
      })
      let decisions = agent.runParcours(this.state.configuration);
      console.log("conf: ", this.state.configuration);
      let directionValue = 38;
      let bestValue = 0;
      var keys = Object.keys(decisions);
      for(var i=0;i<keys.length;i++){
          var key = keys[i];
          if(decisions[key] > bestValue){
            switch (key) {
              case "UP": directionValue = 38;
                         break;
              case "DOWN": directionValue = 40;
                           break;
              case "LEFT": directionValue = 37;
                           break;
              case "RIGHT": directionValue = 39;
                           break;
              default: console.log("Erreur: aucune direction trouvees");
            }
            bestValue = decisions[key];
            this.setState({agentDecision: key})
          }
      }
      this.state.playground.direction = KEY_CODES_MAPPER[directionValue];

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
        <Grid
          snake={snake}
          snack={snack}
          isGameOver={playground.isGameOver}
        />
      </div>
    );
  }
}

const GameOver = () =>
  <div className="game-over-title">
    You loose shitty player, type "R" to reload hihi !
  </div>

const Grid = ({ isGameOver, snake, snack }) =>
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
