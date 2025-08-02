// sudoku.js
function generateSudoku(hideCount = 40) {
  const solution = generateFullBoard()
  const puzzle = hideNumbers(solution, hideCount)
  return { puzzle, solution }
}

function generateFullBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0))
  fillBoard(board)
  return board
}

function fillBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = shuffle([1,2,3,4,5,6,7,8,9])
        for (const num of numbers) {
          if (isSafe(board, row, col, num)) {
            board[row][col] = num
            if (fillBoard(board)) return true
            board[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function isSafe(board, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num || board[x][col] === num) return false
  }
  const startRow = row - row % 3, startCol = col - col % 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false
    }
  }
  return true
}

function hideNumbers(board, count) {
  const puzzle = board.map(row => row.slice())
  let removed = 0
  while (removed < count) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0
      removed++
    }
  }
  return puzzle
}

function checkSolution(solution, userSolution) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (solution[i][j] !== userSolution[i][j]) {
        return false
      }
    }
  }
  return true
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function cloneBoard(board) {
  return board.map(row => row.slice())
}

module.exports = { generateSudoku, checkSolution, cloneBoard }