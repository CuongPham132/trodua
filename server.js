
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Kho câu hỏi
const rawQuestions = [
  { w: "desert", correct: "sa mạc, vùng hoang vu", traps: ["món tráng miệng ngọt ngào", "dòng sông băng", "hòn đảo nhiệt đới"] },
  { w: "affect", correct: "làm ảnh hưởng, tác động đến", traps: ["kết quả, hiệu ứng đạt được", "sự hoàn hảo", "tình cảm thân mật"] },
  { w: "receipt", correct: "biên lai, hóa đơn thanh toán", traps: ["công thức nấu ăn ngon", "lời tiếp đón nồng hậu", "đơn thuốc của bác sĩ"] },
  { w: "borrow", correct: "đi mượn, vay từ người khác", traps: ["cho người khác mượn tiền", "chôn cất xuống đất", "mua đứt luôn"] },
  { w: "sympathetic", correct: "đồng cảm, biết trắc ẩn", traps: ["dễ thương, đáng mến", "rất thông minh", "dễ nổi giận vô cớ"] },
  { w: "sensible", correct: "khôn ngoan, hợp lý, biết điều", traps: ["nhạy cảm, hay khóc nhè", "vô cảm, lạnh lùng", "có giác quan thứ sáu"] },
  { w: "confidential", correct: "bí mật, tuyệt mật nội bộ", traps: ["rất tự tin, quyết đoán", "đầy tham vọng lớn", "đáng tin cậy tuyệt đối"] },
  { w: "argument", correct: "cuộc tranh cãi, lý lẽ phản bác", traps: ["sự đồng thuận hoàn toàn", "bản hợp đồng kinh tế", "sự sắp xếp công việc"] },
  { w: "ubiquitous", correct: "nhan nhản, có mặt khắp mọi nơi", traps: ["cực kỳ độc hại, nguy hiểm", "quý hiếm, khó tìm thấy", "mơ hồ, không rõ ràng"] },
  { w: "ephemeral", correct: "phù du, sớm nở tối tàn, ngắn ngủi", traps: ["vĩnh cửu, trường tồn", "to lớn khổng lồ", "nổi tiếng toàn cầu"] },
  { w: "obsequious", correct: "khúm núm, xun xoe, bợ đỡ", traps: ["ngỗ ngược, chống đối", "rất thông minh xuất chúng", "buồn rầu, ủ rũ"] },
  { w: "equivocal", correct: "ba phải, mập mờ, nước đôi", traps: ["công bằng, bình đẳng", "chắc chắn 100%", "đồng thanh tương ứng"] }
];

const players = new Map();
const matches = new Map();

const MATCH_DURATION = 45;

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function broadcastLobby() {
  io.emit("lobby_update", Array.from(players.values()));
}

// Mỗi trận tạo một bộ câu hỏi không trùng từ.
// Cả hai người dùng chung thứ tự câu hỏi.
function buildMatchQuestions() {
  return shuffle(rawQuestions).map((item, index) => ({
    index,
    word: item.w,
    options: shuffle([item.correct, ...item.traps]),
    correctAnswer: item.correct
  }));
}

function getClientQuestions(questions) {
  return questions.map(q => ({
    index: q.index,
    word: q.word,
    options: q.options
  }));
}

function endMatch(matchId, reason) {
  const match = matches.get(matchId);

  if (!match || match.ended) return;

  match.ended = true;

  if (match.timer) {
    clearInterval(match.timer);
    match.timer = null;
  }

  const s1 = match.p1.score;
  const s2 = match.p2.score;

  let resultP1 = "draw";
  let resultP2 = "draw";

  if (s1 > s2) {
    resultP1 = "win";
    resultP2 = "lose";
  } else if (s2 > s1) {
    resultP1 = "lose";
    resultP2 = "win";
  }

  io.to(match.p1.id).emit("match_end", {
    reason,
    myScore: s1,
    opponentScore: s2,
    result: resultP1,
    opponentName: match.p2.name
  });

  io.to(match.p2.id).emit("match_end", {
    reason,
    myScore: s2,
    opponentScore: s1,
    result: resultP2,
    opponentName: match.p1.name
  });

  if (players.has(match.p1.id)) {
    players.get(match.p1.id).status = "idle";
  }

  if (players.has(match.p2.id)) {
    players.get(match.p2.id).status = "idle";
  }

  matches.delete(matchId);
  broadcastLobby();
}

io.on("connection", socket => {
  socket.on("join_lobby", playerName => {
    const safeName = String(playerName || "").trim().slice(0, 16);

    if (!safeName) return;

    players.set(socket.id, {
      id: socket.id,
      name: safeName,
      status: "idle"
    });

    broadcastLobby();
  });

  socket.on("invite_player", targetSocketId => {
    const sender = players.get(socket.id);
    const target = players.get(targetSocketId);

    if (!sender || !target) return;
    if (sender.status !== "idle" || target.status !== "idle") return;
    if (socket.id === targetSocketId) return;

    io.to(targetSocketId).emit("receive_invite", {
      fromId: socket.id,
      fromName: sender.name
    });
  });

  socket.on("respond_invite", payload => {
    if (!payload || typeof payload.fromId !== "string") return;

    const { fromId, accept } = payload;
    const sender = players.get(fromId);
    const receiver = players.get(socket.id);

    if (!sender || !receiver || fromId === socket.id) return;

    if (!accept) {
      io.to(fromId).emit("invite_rejected", {
        byName: receiver.name
      });
      return;
    }

    if (sender.status !== "idle" || receiver.status !== "idle") {
      socket.emit("match_error", "Đối thủ không còn khả dụng!");
      return;
    }

    sender.status = "in_match";
    receiver.status = "in_match";

    const matchId =
      `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const questions = buildMatchQuestions();

    const matchState = {
      id: matchId,

      p1: {
        id: sender.id,
        name: sender.name,
        score: 0,
        answered: new Set(),
        nextQuestionIndex: 0
      },

      p2: {
        id: receiver.id,
        name: receiver.name,
        score: 0,
        answered: new Set(),
        nextQuestionIndex: 0
      },

      questions,
      timeLeft: MATCH_DURATION,
      timer: null,
      ended: false
    };

    matches.set(matchId, matchState);

    const clientQuestions = getClientQuestions(questions);

    io.to(sender.id).emit("match_start", {
      matchId,
      opponentName: receiver.name,
      questions: clientQuestions,
      duration: MATCH_DURATION
    });

    io.to(receiver.id).emit("match_start", {
      matchId,
      opponentName: sender.name,
      questions: clientQuestions,
      duration: MATCH_DURATION
    });

    matchState.timer = setInterval(() => {
      if (!matches.has(matchId)) return;

      matchState.timeLeft--;

      io.to(sender.id).to(receiver.id).emit("match_tick", {
        timeLeft: matchState.timeLeft
      });

      if (matchState.timeLeft <= 0) {
        endMatch(matchId, "Hết thời gian thi đấu!");
      }
    }, 1000);

    broadcastLobby();
  });

  socket.on("submit_answer", payload => {
    if (!payload || typeof payload.matchId !== "string") return;

    const { matchId, questionIndex, selectedAnswer } = payload;
    const match = matches.get(matchId);

    if (!match || match.ended) return;

    // Chỉ người thuộc trận đấu mới được trả lời.
    let currentPlayer;

    if (match.p1.id === socket.id) {
      currentPlayer = match.p1;
    } else if (match.p2.id === socket.id) {
      currentPlayer = match.p2;
    } else {
      return;
    }

    // Không nhận chỉ số câu hỏi không hợp lệ.
    if (!Number.isInteger(questionIndex)) return;
    if (questionIndex < 0 || questionIndex >= match.questions.length) return;

    // CHỐT KHÓA:
    // Chỉ nhận đúng câu tiếp theo của người chơi.
    // Gửi lại câu cũ hoặc nhảy tới câu tương lai đều bị từ chối.
    if (questionIndex !== currentPlayer.nextQuestionIndex) return;

    // Chặn gửi lại câu đã chấm.
    if (currentPlayer.answered.has(questionIndex)) return;

    const question = match.questions[questionIndex];

    // Chỉ chấp nhận đáp án thuộc các lựa chọn của câu đó.
    if (!question.options.includes(selectedAnswer)) return;

    // Đánh dấu câu đã dùng và chuyển tiến độ đúng một lần.
    currentPlayer.answered.add(questionIndex);
    currentPlayer.nextQuestionIndex++;

    const isCorrect = selectedAnswer === question.correctAnswer;

    if (isCorrect) {
      currentPlayer.score++;
    }

    // Chỉ trả kết quả cho chính người trả lời.
    // Không gửi điểm tức thời cho đối thủ.
    socket.emit("answer_feedback", {
      questionIndex,
      isCorrect,
      correctAnswer: question.correctAnswer,
      myCurrentScore: currentPlayer.score
    });

    // Kết thúc khi cả hai đã trả lời hết bộ câu hỏi.
    const p1Finished =
      match.p1.nextQuestionIndex >= match.questions.length;

    const p2Finished =
      match.p2.nextQuestionIndex >= match.questions.length;

    if (p1Finished && p2Finished) {
      endMatch(matchId, "Cả hai đã hoàn thành tất cả câu hỏi!");
    }
  });

  socket.on("disconnect", () => {
    for (const [matchId, match] of matches.entries()) {
      if (match.p1.id !== socket.id && match.p2.id !== socket.id) {
        continue;
      }

      if (match.timer) {
        clearInterval(match.timer);
        match.timer = null;
      }

      const disconnectedP1 = match.p1.id === socket.id;
      const survivor = disconnectedP1 ? match.p2 : match.p1;

      io.to(survivor.id).emit(
        "match_abort",
        "Đối thủ đã mất kết nối hoặc thoát trận!"
      );

      if (players.has(survivor.id)) {
        players.get(survivor.id).status = "idle";
      }

      matches.delete(matchId);
    }

    players.delete(socket.id);
    broadcastLobby();
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
