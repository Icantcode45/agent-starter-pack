document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('bestScore') || 0;
    let gameOver = false;
    let gameWon = false;
    let canMove = true;

    // DOM elements
    const gridElement = document.querySelector('.grid');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const gameMessage = document.querySelector('.game-message');
    const restartButton = document.querySelector('.restart-button');

    // Initialize the game
    function initGame() {
        // Reset game state
        grid = Array(4).fill().map(() => Array(4).fill(0));
        score = 0;
        gameOver = false;
        gameWon = false;
        canMove = true;

        // Update UI
        updateScore();
        gameMessage.className = 'game-message';

        // Clear the grid
        gridElement.innerHTML = '';

        // Create grid cells
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            gridElement.appendChild(cell);
        }

        // Add initial tiles
        addRandomTile();
        addRandomTile();

        // Render initial state
        render();
    }

    // Add a random tile (2 or 4) to an empty cell
    function addRandomTile() {
        const emptyCells = [];

        // Find all empty cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        // If there are empty cells, add a new tile
        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[row][col] = Math.random() < 0.9 ? 2 : 4;

            // Create and animate the new tile
            const tile = createTile(row, col, grid[row][col]);
            tile.classList.add('tile-new');

            // Remove the new-tile class after animation completes
            setTimeout(() => {
                tile.classList.remove('tile-new');
            }, 200);
        }
    }

    // Create a tile element
    function createTile(row, col, value) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        tile.textContent = value;
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.value = value;

        // Position the tile
        updateTilePosition(tile, row, col, false);

        // Add to grid
        gridElement.appendChild(tile);
        return tile;
    }

    // Update a tile's position with optional animation
    function updateTilePosition(tile, row, col, animate = true) {
        const cellSize = gridElement.offsetWidth / 4;
        const x = col * (cellSize + 15) + 15;
        const y = row * (cellSize + 15) + 15;

        if (animate) {
            tile.style.transition = 'all 0.15s ease-in-out';
        } else {
            tile.style.transition = 'none';
        }

        tile.style.transform = `translate(${x}px, ${y}px)`;
        tile.style.width = `${cellSize - 15}px`;
        tile.style.height = `${cellSize - 15}px`;
        tile.style.lineHeight = `${cellSize - 15}px`;

        // Update data attributes
        tile.dataset.row = row;
        tile.dataset.col = col;
    }

    // Render the current game state
    function render() {
        const tiles = document.querySelectorAll('.tile');

        // Update tile positions and values
        tiles.forEach(tile => {
            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            const value = grid[row][col];

            // If the value has changed (due to merge), update the tile
            if (parseInt(tile.dataset.value) !== value) {
                tile.textContent = value;
                tile.className = `tile tile-${value}`;
                tile.dataset.value = value;
                tile.classList.add('tile-merged');

                // Remove the merged class after animation completes
                setTimeout(() => {
                    tile.classList.remove('tile-merged');
                }, 200);
            }

            // Update position
            updateTilePosition(tile, row, col);
        });

        // Update score
        updateScore();

        // Check for game over or win
        if (!gameWon && hasWon()) {
            gameWon = true;
            showGameMessage('You Win!', false);
        } else if (!canMove && isGameOver()) {
            showGameMessage('Game Over!', true);
        }
    }

    // Update the score display
    function updateScore() {
        scoreElement.textContent = score;

        // Update best score if current score is higher
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore);
        }
        bestScoreElement.textContent = bestScore;
    }

    // Show game message (win or game over)
    function showGameMessage(message, isGameOver) {
        gameMessage.querySelector('p').textContent = message;
        gameMessage.classList.add('visible');
        if (isGameOver) {
            gameMessage.classList.add('game-over');
        } else {
            gameMessage.classList.add('game-won');
        }
    }

    // Check if the player has won (reached 2048)
    function hasWon() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (grid[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    // Check if the game is over (no more moves possible)
    function isGameOver() {
        // Check for any empty cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (grid[row][col] === 0) {
                    return false;
                }
            }
        }

        // Check for possible merges
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const value = grid[row][col];

                // Check right neighbor
                if (col < 3 && grid[row][col + 1] === value) {
                    return false;
                }

                // Check bottom neighbor
                if (row < 3 && grid[row + 1][col] === value) {
                    return false;
                }
            }
        }

        return true;
    }

    // Move tiles in the specified direction
    async function move(direction) {
        if (!canMove) return false;

        let moved = false;
        const newGrid = JSON.parse(JSON.stringify(grid));

        // Process the grid based on direction
        if (direction === 'up' || direction === 'down') {
            for (let col = 0; col < 4; col++) {
                const column = [];

                // Extract the column
                for (let row = 0; row < 4; row++) {
                    if (grid[row][col] !== 0) {
                        column.push(grid[row][col]);
                    }
                }

                // Process the column
                const { merged, newColumn } = mergeTiles(column, direction === 'down');

                // Update the grid
                for (let row = 0; row < 4; row++) {
                    const newRow = direction === 'down' ? 3 - row : row;
                    if (row < newColumn.length) {
                        const value = newColumn[direction === 'down' ? newColumn.length - 1 - row : row];
                        if (grid[newRow][col] !== value) {
                            moved = true;
                        }
                        newGrid[newRow][col] = value;
                    } else {
                        newGrid[newRow][col] = 0;
                    }
                }

                // Update score
                if (merged) {
                    score += merged * 2;
                }
            }
        } else { // left or right
            for (let row = 0; row < 4; row++) {
                const rowTiles = [];

                // Extract the row
                for (let col = 0; col < 4; col++) {
                    if (grid[row][col] !== 0) {
                        rowTiles.push(grid[row][col]);
                    }
                }

                // Process the row
                const { merged, newColumn: newRow } = mergeTiles(rowTiles, direction === 'right');

                // Update the grid
                for (let col = 0; col < 4; col++) {
                    const newCol = direction === 'right' ? 3 - col : col;
                    if (col < newRow.length) {
                        const value = newRow[direction === 'right' ? newRow.length - 1 - col : col];
                        if (grid[row][newCol] !== value) {
                            moved = true;
                        }
                        newGrid[row][newCol] = value;
                    } else {
                        newGrid[row][newCol] = 0;
                    }
                }

                // Update score
                if (merged) {
                    score += merged * 2;
                }
            }
        }

        // If the grid changed, update it and add a new tile
        if (moved) {
            grid = newGrid;

            // Disable further moves until animations complete
            canMove = false;

            // Wait for animations to complete
            await new Promise(resolve => setTimeout(resolve, 150));

            // Add a new tile and re-enable moves
            addRandomTile();
            canMove = true;

            // Check for game over
            if (isGameOver()) {
                canMove = false;
                gameOver = true;
                showGameMessage('Game Over!', true);
            }

            // Re-render the grid
            render();
        }

        return moved;
    }

    // Merge tiles in a row or column
    function mergeTiles(tiles, reverse) {
        if (reverse) {
            tiles = tiles.reverse();
        }

        const result = [];
        let merged = null;

        for (let i = 0; i < tiles.length; i++) {
            if (i < tiles.length - 1 && tiles[i] === tiles[i + 1] && tiles[i] !== 0) {
                // Merge tiles with the same value
                result.push(tiles[i] * 2);
                merged = tiles[i];
                i++; // Skip the next tile as it's been merged
            } else if (tiles[i] !== 0) {
                result.push(tiles[i]);
            }
        }

        // Add zeros to maintain length
        while (result.length < 4) {
            result.push(0);
        }

        if (reverse) {
            return { merged, newColumn: result.slice(0, 4).reverse() };
        }

        return { merged, newColumn: result.slice(0, 4) };
    }

    // Handle keyboard input
    function handleKeyDown(event) {
        if (!canMove) return;

        let moved = false;

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                move('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                move('down');
                break;
            case 'ArrowLeft':
                event.preventDefault();
                move('left');
                break;
            case 'ArrowRight':
                event.preventDefault();
                move('right');
                break;
        }
    }

    // Handle touch events for mobile
    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(event) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }

    function handleTouchEnd(event) {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;

        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Determine the direction of the swipe
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                move('left');
            } else {
                move('right');
            }
        } else {
            // Vertical swipe
            if (diffY > 0) {
                move('up');
            } else {
                move('down');
            }
        }

        // Reset touch coordinates
        touchStartX = 0;
        touchStartY = 0;
    }

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);

    // Touch events for mobile
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchend', handleTouchEnd, false);

    // Prevent scrolling on touch devices
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    // Restart button
    restartButton.addEventListener('click', initGame);

    // Start the game
    initGame();
});
