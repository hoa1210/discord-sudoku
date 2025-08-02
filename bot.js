// bot.js
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js')
const dotenv = require('dotenv')
const fs = require('fs')
const { generateSudoku, checkSolution, cloneBoard } = require('./sudoku')
const { drawSudoku } = require('./drawSudoku')

dotenv.config()

const PREFIX = '!b'
const MAX_WRONG_ATTEMPTS = 5
const LEADERBOARD_FILE = './leaderboard.json'

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
})

const gameBoards = new Map()
let leaderboard = {}

// Load leaderboard from file if exists
if (fs.existsSync(LEADERBOARD_FILE)) {
  leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'))
}

function saveLeaderboard() {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2))
}

client.once('ready', () => {
  console.log(`✅ Bot đã xuất trận với tên ${client.user.tag} – chuẩn bị "xoắn não" chưa? 🧠`)
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  const content = message.content.trim()
  if (!content.startsWith(PREFIX)) return

  const [cmd, ...args] = content.slice(PREFIX.length).trim().split(/\s+/)
  const command = cmd.toLowerCase()
  const userId = message.author.id
  const username = message.author.username

  if (!leaderboard[userId]) {
    leaderboard[userId] = { level: 1, score: 0, name: username }
  }

  if (command === 'sudoku') {
    if (gameBoards.has(message.channel.id)) {
      return message.channel.send('⚠️ Gì mà vội vậy? Giải xong bàn hiện tại rồi mới được chơi tiếp chứ! 🧩')
    }

    const level = leaderboard[userId].level
    const hideCount = Math.min(40 + (level - 1) * 5, 75)

    const board = generateSudoku(hideCount)
    const userBoard = cloneBoard(board.puzzle)

    gameBoards.set(message.channel.id, {
      puzzle: board.puzzle,
      solution: board.solution,
      userBoard,
      wrongAttempts: 0,
      userId,
      level
    })

    const imageBuffer = drawSudoku(board.puzzle, userBoard)
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'sudoku.png' })

    message.channel.send({
      content: `🧩 Sudoku cấp độ ${level} đã sẵn sàng! Tăng đô rồi đó nha! 🔥`,
      files: [attachment]
    })
  }

  if (command === 'set') {
    if (args.length !== 3) {
      return message.channel.send(`❌ Dùng thế này cơ: \`${PREFIX}set hàng cột số\` – Không biết đọc hướng dẫn à? 🤨`)
    }

    const [rowStr, colStr, numStr] = args
    const row = parseInt(rowStr) - 1
    const col = parseInt(colStr) - 1
    const num = parseInt(numStr)

    const game = gameBoards.get(message.channel.id)
    if (!game) {
      return message.channel.send('❗ Trò Sudoku chưa bắt đầu. Đánh `!bsudoku` đi rồi ta "quẩy"!')
    }

    if (game.userId !== userId) {
      return message.channel.send('🚫 Không chen hàng! Đây là màn chơi của người khác!')
    }

    if (game.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      gameBoards.delete(message.channel.id)
      return message.channel.send('❌ Game over! Bạn đã "toang" vì sai quá nhiều! 😵')
    }

    if (isNaN(row) || isNaN(col) || isNaN(num) || row < 0 || row > 8 || col < 0 || col > 8 || num < 1 || num > 9) {
      return message.channel.send('❌ Nhập sai rồi "thánh" ơi. Hàng/cột từ 1-9, số từ 1-9 nha! 🧮')
    }

    if (game.puzzle[row][col] !== 0) {
      await message.react('⚠️')
      return
    }

    const correctNum = game.solution[row][col]
    if (num !== correctNum) {
      game.wrongAttempts++
      leaderboard[userId].score = Math.max(0, leaderboard[userId].score - 1)
      saveLeaderboard()
      await message.react('❌')
      return
    }

    game.userBoard[row][col] = num
    leaderboard[userId].score += 1
    saveLeaderboard()
    await message.react('✅')
  }

  if (command === 'show') {
    const game = gameBoards.get(message.channel.id)
    if (!game) {
      return message.channel.send('❗ Chưa có Sudoku để khoe. Tạo cái đi chứ!')
    }

    const imageBuffer = drawSudoku(game.puzzle, game.userBoard)
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'your_board.png' })

    message.channel.send({
      content: '🧩 Đây là bảng Sudoku của bạn – nhìn "thơm" chưa? 😎',
      files: [attachment]
    })
  }

  if (command === 'submit') {
    const game = gameBoards.get(message.channel.id)
    if (!game) {
      return message.channel.send('❗ Có Sudoku đâu mà nộp? Ảo thật đấy!')
    }

    if (game.userId !== userId) {
      return message.channel.send('🚫 Ai cho nộp hộ vậy? Đây là game của người khác!')
    }

    if (checkSolution(game.solution, game.userBoard)) {
      gameBoards.delete(message.channel.id)
      leaderboard[userId].level += 1
      leaderboard[userId].score += 10
      saveLeaderboard()
      message.channel.send(`🎉 Chính xác! Bạn là "thánh Sudoku" rồi đó! 🏆 Level: ${leaderboard[userId].level}, Điểm: ${leaderboard[userId].score}`)
    } else {
      message.channel.send('❌ Sai bét! Bạn tưởng dễ thế à? 😅')
    }
  }

  if (command === 'solution') {
    const game = gameBoards.get(message.channel.id)
    if (!game) {
      return message.channel.send('❗ Làm gì có trò nào đang chạy đâu...')
    }

    const imageBuffer = drawSudoku(game.solution, game.solution)
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'solution.png' })

    message.channel.send({
      content: '🔍 Đây là đáp án – chép lẹ trước khi bot phát hiện! 😜',
      files: [attachment]
    })
  }

  if (command === 'level') {
    const { level, score } = leaderboard[userId]
    message.channel.send(`📈 Level hiện tại: ${level}, Điểm: ${score}`)
  }

  if (command === 'leaderboard') {
    const sorted = Object.entries(leaderboard)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5)

    const lines = sorted.map(([id, data], idx) => `#${idx + 1} ${data.name}: Level ${data.level}, Điểm ${data.score}`)

    message.channel.send(`🏆 Top 5 cao thủ Sudoku:
${lines.join('\n')}`)
  }

  if (command === 'help') {
    return message.channel.send(
      `📋 Hướng dẫn cho "gà":\n` +
      `- \`${PREFIX}sudoku\`: Bắt đầu ván mới (để "đập đầu vào tường")\n` +
      `- \`${PREFIX}set hàng cột số\`: Điền số vào ô (VD: \`${PREFIX}set 1 2 5\`)\n` +
      `- \`${PREFIX}show\`: Xem bảng hiện tại và than thở\n` +
      `- \`${PREFIX}submit\`: Nộp bài – tự tin thì làm\n` +
      `- \`${PREFIX}solution\`: Xem đáp án – hết chịu nổi thì dùng\n` +
      `- \`${PREFIX}level\`: Xem cấp độ và điểm hiện tại\n` +
      `- \`${PREFIX}leaderboard\`: Xem top điểm cao\n` +
      `- \`${PREFIX}help\`: Xem lại hướng dẫn vì quên hoài!`
    )
  }
})

client.login(process.env.DISCORD_TOKEN)