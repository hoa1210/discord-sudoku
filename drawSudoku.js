// drawSudoku.js
const { createCanvas, loadImage, registerFont } = require('canvas')

// Optional: register a game-style font (must be installed or use path to .ttf)
// registerFont('./fonts/Orbitron-Regular.ttf', { family: 'Orbitron' })

function drawSudoku(puzzle, userBoard, highlightWrong = false) {
  const size = 450
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background - subtle gradient with texture effect
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#fdf6e3')
  gradient.addColorStop(1, '#eee8d5')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const cellSize = size / 9

  // Draw grid with thicker borders for 3x3 blocks
  for (let i = 0; i <= 9; i++) {
    ctx.beginPath()
    ctx.moveTo(i * cellSize, 0)
    ctx.lineTo(i * cellSize, size)
    ctx.strokeStyle = i % 3 === 0 ? '#654321' : '#aaa'
    ctx.lineWidth = i % 3 === 0 ? 3 : 1
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, i * cellSize)
    ctx.lineTo(size, i * cellSize)
    ctx.strokeStyle = i % 3 === 0 ? '#654321' : '#aaa'
    ctx.lineWidth = i % 3 === 0 ? 3 : 1
    ctx.stroke()
  }

  // Numbers with stylish font and shadow
  ctx.font = 'bold 26px Arial' // Change to 'Orbitron' if registered
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const x = col * cellSize + cellSize / 2
      const y = row * cellSize + cellSize / 2
      const original = puzzle[row][col]
      const current = userBoard[row][col]

      if (original !== 0) {
        ctx.fillStyle = '#000'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 2
        ctx.fillText(original, x, y)
        ctx.shadowBlur = 0
      } else if (current !== 0) {
        // Background circle for user input
        ctx.fillStyle = '#cceeff'
        ctx.beginPath()
        ctx.arc(x, y, cellSize * 0.4, 0, Math.PI * 2)
        ctx.fill()

        // Number
        ctx.fillStyle = '#0077cc'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.shadowBlur = 2
        ctx.fillText(current, x, y)
        ctx.shadowBlur = 0

        // Highlight wrong entries if flag is set
        if (highlightWrong && current !== original && original !== 0) {
          ctx.strokeStyle = '#cc0000'
          ctx.lineWidth = 2
          ctx.strokeRect(col * cellSize + 2, row * cellSize + 2, cellSize - 4, cellSize - 4)
        }
      }
    }
  }

  return canvas.toBuffer()
}

module.exports = { drawSudoku }