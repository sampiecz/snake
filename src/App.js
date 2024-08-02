import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

const Snake = () => {
  const [height, setHeight] = useState(10);
  const [width, setWidth] = useState(10);
  const [tiles, setTiles] = useState([]);
  const [tailPositions, setTailPositions] = useState([]);
  const [dotPosition, setDotPosition] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [direction, setDirection] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [grow, setGrow] = useState(false);
  const intervalRef = useRef(null);
  const hasAlertedRef = useRef(false);

  const handleStartButtonClick = () => {
    setTailPositions([]);
    setDotPosition(null);
    setTiles([]);
    setPlaying(true);
    setDirection(null);
    setGameOver(false);
    setGameStarted(false);
    setGrow(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    hasAlertedRef.current = false;
  };

  function* range(n) {
    for (let i = 0; i < n; i++) {
      yield i;
    }
  }

  const getRandomEmptyPosition = () => {
    let x, y;
    do {
      x = Math.floor(Math.random() * height);
      y = Math.floor(Math.random() * width);
    } while (tiles[x][y].value !== 'empty' || tailPositions.some(pos => pos.x === x && pos.y === y));
    return { x, y };
  };

  const generateTiles = () => {
    let grid = [];
    for (const x of range(height)) {
      grid.push([]);
      for (const _ of range(width)) {
        grid[x].push({ value: 'empty' });
      }
    }
    setTiles(grid);
  };

  const setStartingPositions = () => {
    let { x, y } = getRandomEmptyPosition();
    setTailPositions([{ x, y, value: 'tail' }]);

    let { x: dotX, y: dotY } = getRandomEmptyPosition();
    setDotPosition({ x: dotX, y: dotY, value: 'dot' });
  };

  const updateTilePositions = () => {
    let grid = tiles.map(row => row.map(tile => ({ ...tile })));

    grid.forEach(row => row.forEach(tile => {
      if (tile.value === 'tail' || tile.value === 'head') {
        tile.value = 'empty';
      }
    }));

    if (tailPositions.length > 0) {
      const { x, y } = tailPositions[0];
      if (grid[x] && grid[x][y]) {
        grid[x][y].value = 'head';
      }
    }

    tailPositions.slice(1).forEach(({ x, y }) => {
      if (grid[x] && grid[x][y]) {
        grid[x][y].value = 'tail';
      }
    });

    if (dotPosition) {
      const { x, y } = dotPosition;
      if (grid[x] && grid[x][y]) {
        grid[x][y].value = 'dot';
      }
    }

    setTiles(grid);
  };

  const handleArrowKey = (event) => {
    const newDirection = {
      'ArrowDown': 'down',
      'ArrowUp': 'up',
      'ArrowLeft': 'left',
      'ArrowRight': 'right'
    }[event.key];

    if (newDirection) {
      if (!gameStarted) {
        setGameStarted(true);
        setPlaying(true);
      }

      if (direction && newDirection !== direction && !(
        (direction === 'up' && newDirection === 'down') ||
        (direction === 'down' && newDirection === 'up') ||
        (direction === 'left' && newDirection === 'right') ||
        (direction === 'right' && newDirection === 'left')
      )) {
        setDirection(newDirection);
      } else if (!direction) {
        setDirection(newDirection);
      }
    }
  };

  const moveTail = () => {
    if (gameOver) return;

    const directions = {
      'down': { x: 1, y: 0 },
      'up': { x: -1, y: 0 },
      'right': { x: 0, y: 1 },
      'left': { x: 0, y: -1 },
    };

    if (!direction) return;

    const { x: dx, y: dy } = directions[direction];
    const head = tailPositions[0];
    const newHead = { x: head.x + dx, y: head.y + dy };

    const outOfBounds = (newHead.x < 0 || newHead.x >= height || newHead.y < 0 || newHead.y >= width);
    if (outOfBounds) {
      if (!hasAlertedRef.current) {
        setGameOver(true);
        alert('Game over! Click OK to play again.');
        hasAlertedRef.current = true;
      }
      setPlaying(false);
      return;
    }

    if (tailPositions.some(pos => pos.x === newHead.x && pos.y === newHead.y)) {
      if (!hasAlertedRef.current) {
        setGameOver(true);
        alert('Game over! Click OK to play again.');
        hasAlertedRef.current = true;
      }
      setPlaying(false);
      return;
    }

    setTailPositions(prev => {
      const newTail = [newHead, ...prev];
      if (!grow) {
        newTail.pop();
      }
      return newTail;
    });

    if (newHead.x === dotPosition.x && newHead.y === dotPosition.y) {
      setGrow(true);

      let { x: dotX, y: dotY } = getRandomEmptyPosition();
      setDotPosition({ x: dotX, y: dotY, value: 'dot' });

      if (tailPositions.length >= height * width) {
        if (!hasAlertedRef.current) {
          alert('Success! You have won the game. Click OK to play again.');
          hasAlertedRef.current = true;
        }
        setPlaying(false);
        return;
      }
    } else {
      setGrow(false);
    }
  };

  useEffect(() => {
    if (playing) {
      generateTiles();
    }
  }, [playing]);

  useEffect(() => {
    if (tiles.length > 0) {
      updateTilePositions();
    }
  }, [tiles, tailPositions, dotPosition]);

  useEffect(() => {
    if (tiles.length > 0 && !tailPositions.length && !dotPosition) {
      setStartingPositions();
    }
  }, [tiles]);

  useEffect(() => {
    window.addEventListener('keydown', handleArrowKey);
    return () => {
      window.removeEventListener('keydown', handleArrowKey);
    };
  }, [handleArrowKey]);

  useEffect(() => {
    if (direction && tailPositions.length && !gameOver && gameStarted) {
      intervalRef.current = setInterval(() => {
        moveTail();
      }, 200);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [direction, tailPositions, gameOver, gameStarted]);

  return (
    <div className="grid">
      {playing ?
        <>
          {tiles.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map(({ value }, columnIndex) => (
                <div key={columnIndex} className={`column ${value}`}></div>
              ))}
            </div>
          ))}
        </>
        :
        <>
          <h1>Play Snake</h1>
          <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
          <button onClick={handleStartButtonClick}>Start</button>
        </>
      }
    </div>
  );
};

export default Snake;

