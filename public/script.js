/* ========================================================
   PHẦN 1: CHƠI ĐƠN (GIỮ NGUYÊN CƠ CHẾ 3 TẦNG)
   ======================================================== */

const wordDatabase = {
  tier1: [
    { w: "desert", correct: "sa mạc, vùng hoang vu", traps: ["món tráng miệng ngọt ngào", "dòng sông băng", "hòn đảo nhiệt đới"], troll: "Nhầm với 'dessert' (2 chữ s) rồi con gà!" },
    { w: "affect", correct: "làm ảnh hưởng, tác động đến", traps: ["kết quả, hiệu ứng đạt được", "sự hoàn hảo", "tình cảm thân mật"], troll: "Nhầm động từ 'affect' với danh từ 'effect' rồi kìa!" },
    { w: "receipt", correct: "biên lai, hóa đơn thanh toán", traps: ["công thức nấu ăn ngon", "lời tiếp đón nồng hậu", "đơn thuốc của bác sĩ"], troll: "Công thức nấu ăn là 'recipe' bạn ơi, nhìn kỹ chữ 't' ở cuối!" },
    { w: "borrow", correct: "đi mượn, vay từ người khác", traps: ["cho người khác mượn tiền", "chôn cất xuống đất", "mua đứt luôn"], troll: "Cho mượn là 'lend', còn 'borrow' là đi mượn của người ta!" }
  ],

  tier2: [
    { w: "sympathetic", correct: "đồng cảm, biết trắc ẩn", traps: ["dễ thương, đáng mến", "rất thông minh", "dễ nổi giận vô cớ"], troll: "Nhìn giống 'sympathique' tiếng Pháp tưởng dễ thương hả? Đây là đồng cảm!" },
    { w: "sensible", correct: "khôn ngoan, hợp lý, biết điều", traps: ["nhạy cảm, hay khóc nhè", "vô cảm, lạnh lùng", "có giác quan thứ sáu"], troll: "Nhạy cảm là 'sensitive' cơ, bị lừa ngọt xớt!" },
    { w: "confidential", correct: "bí mật, tuyệt mật nội bộ", traps: ["rất tự tin, quyết đoán", "đầy tham vọng lớn", "đáng tin cậy tuyệt đối"], troll: "Tự tin là 'confident', còn từ này là hồ sơ tuyệt mật!" },
    { w: "argument", correct: "cuộc tranh cãi, lý lẽ phản bác", traps: ["sự đồng thuận hoàn toàn", "bản hợp đồng kinh tế", "sự sắp xếp công việc"], troll: "Argument là cãi cọ nảy lửa chứ đồng thuận nỗi gì!" }
  ],

  tier3: [
    { w: "ubiquitous", correct: "nhan nhản, có mặt khắp mọi nơi", traps: ["cực kỳ độc hại, nguy hiểm", "quý hiếm, khó tìm thấy", "mơ hồ, không rõ ràng"], troll: "Từ C1 huyền thoại: 'ubiquitous' là nhan nhản ở khắp mọi xó xỉnh!" },
    { w: "ephemeral", correct: "phù du, sớm nở tối tàn, ngắn ngủi", traps: ["vĩnh cửu, trường tồn", "to lớn khổng lồ", "nổi tiếng toàn cầu"], troll: "Ảo mộng phù du thôi, streak của bạn cũng sớm nở tối tàn y hệt nghĩa từ này!" },
    { w: "obsequious", correct: "khúm núm, xun xoe, bợ đỡ", traps: ["ngỗ ngược, chống đối", "rất thông minh xuất chúng", "buồn rầu, ủ rũ"], troll: "Obsequious là kẻ chuyên đi nịnh nọt luồn cúi, học lại C2 đi bạn!" },
    { w: "equivocal", correct: "ba phải, mập mờ, nước đôi", traps: ["công bằng, bình đẳng", "chắc chắn 100%", "đồng thanh tương ứng"], troll: "Tưởng giống 'equal' nên khoanh công bằng à? Nghĩa là mập mờ nước đôi!" }
  ]
};

let streak = 0;
let highScore = parseInt(localStorage.getItem("vocab_high_score")) || 0;
let currentQuestion = null;

const streakEl = document.getElementById("current-streak");
const highScoreEl = document.getElementById("high-score");
const tierBadgeEl = document.getElementById("tier-badge");
const qCounterEl = document.getElementById("q-counter");
const wordDisplayEl = document.getElementById("word-display");
const optionsGridEl = document.getElementById("options-grid");
const feedbackMsgEl = document.getElementById("feedback-msg");
const btnNext = document.getElementById("btn-next");
const btnReset = document.getElementById("btn-reset");

highScoreEl.innerText = highScore;

function getActiveTierData() {
  if (streak < 10) {
    return {
      tierName: "TẦNG 1: KHỞI ĐỘNG (DỄ BẪY)",
      tierClass: "tier-1",
      data: wordDatabase.tier1
    };
  }

  if (streak < 20) {
    return {
      tierName: "TẦNG 2: BẪY NÃO TRUNG CẤP",
      tierClass: "tier-2",
      data: wordDatabase.tier2
    };
  }

  return {
    tierName: "TẦNG 3: ÁC MỘNG C1 - C2",
    tierClass: "tier-3",
    data: wordDatabase.tier3
  };
}

function loadNextQuestion() {
  feedbackMsgEl.innerHTML = "";
  btnNext.classList.add("hidden");

  const activeTier = getActiveTierData();

  tierBadgeEl.innerText = activeTier.tierName;
  tierBadgeEl.className = `badge ${activeTier.tierClass}`;
  qCounterEl.innerText = `Câu: ${streak + 1}`;

  const pool = activeTier.data;
  currentQuestion = pool[Math.floor(Math.random() * pool.length)];

  wordDisplayEl.innerText = currentQuestion.w;
  optionsGridEl.innerHTML = "";

  const options = [
    { text: currentQuestion.correct, isCorrect: true },
    ...currentQuestion.traps.map(trapText => ({
      text: trapText,
      isCorrect: false
    }))
  ].sort(() => Math.random() - 0.5);

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt.text;
    btn.onclick = () => checkSoloAnswer(btn, opt);
    optionsGridEl.appendChild(btn);
  });
}

function checkSoloAnswer(selectedBtn, opt) {
  const allBtns = optionsGridEl.querySelectorAll(".option-btn");
  allBtns.forEach(btn => {
    btn.disabled = true;
  });

  if (opt.isCorrect) {
    selectedBtn.classList.add("correct");
    streak++;

    if (streak > highScore) {
      highScore = streak;
      localStorage.setItem("vocab_high_score", highScore);
      highScoreEl.innerText = highScore;
    }

    feedbackMsgEl.innerHTML =
      `<span style="color:var(--correct); font-weight:700;">🎯 Quá tỉnh! Chuỗi hiện tại: ${streak}</span>`;
  } else {
    selectedBtn.classList.add("wrong");

    feedbackMsgEl.innerHTML = `
      <div style="color:var(--wrong)">
        💥 <b>${currentQuestion.troll}</b><br>
        <small style="color:var(--text-muted)">
          Nghĩa chuẩn: <b>${currentQuestion.correct}</b>
        </small>
      </div>
    `;

    streak = 0;

    allBtns.forEach(btn => {
      if (btn.innerText === currentQuestion.correct) {
        btn.classList.add("correct");
      }
    });
  }

  streakEl.innerText = streak;
  btnNext.classList.remove("hidden");
}

btnNext.onclick = loadNextQuestion;

btnReset.onclick = () => {
  if (confirm("Reset kỷ lục về 0 để làm lại từ đầu?")) {
    streak = 0;
    highScore = 0;

    localStorage.removeItem("vocab_high_score");

    streakEl.innerText = 0;
    highScoreEl.innerText = 0;

    loadNextQuestion();
  }
};

loadNextQuestion();

/* ========================================================
   PHẦN 2: CHUYỂN TAB SOLO <-> PVP
   ======================================================== */

const tabSoloBtn = document.getElementById("tab-solo-btn");
const tabPvPBtn = document.getElementById("tab-pvp-btn");
const soloSection = document.getElementById("solo-section");
const pvpSection = document.getElementById("pvp-section");

tabSoloBtn.onclick = () => {
  tabSoloBtn.classList.add("active");
  tabPvPBtn.classList.remove("active");

  soloSection.classList.remove("hidden");
  pvpSection.classList.add("hidden");
};

tabPvPBtn.onclick = () => {
  tabPvPBtn.classList.add("active");
  tabSoloBtn.classList.remove("active");

  pvpSection.classList.remove("hidden");
  soloSection.classList.add("hidden");

  initSocketIfNeeded();
};

/* ========================================================
   PHẦN 3: LOGIC PVP CLIENT
   ======================================================== */

// Đổi URL này thành URL backend thật trên Render khi deploy.
const BACKEND_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://trodua.onrender.com";

let socket = null;
let currentMatchId = null;
let pvpQuestions = [];
let currentPvPQIndex = 0;
let pendingInviterId = null;

const connStatusEl = document.getElementById("connection-status");
const nameScreen = document.getElementById("pvp-name-screen");
const lobbyScreen = document.getElementById("pvp-lobby-screen");
const matchScreen = document.getElementById("pvp-match-screen");
const resultScreen = document.getElementById("pvp-result-screen");
const nameInput = document.getElementById("player-name-input");
const btnJoinLobby = document.getElementById("btn-join-lobby");
const myDisplayNameEl = document.getElementById("my-display-name");
const playerListEl = document.getElementById("player-list");
const inviteModal = document.getElementById("invite-modal");
const inviterNameEl = document.getElementById("inviter-name");
const btnAcceptInvite = document.getElementById("btn-accept-invite");
const btnRejectInvite = document.getElementById("btn-reject-invite");

// Lấy tên đã lưu trước đó.
const savedName = localStorage.getItem("pvp_player_name") || "";

let hasJoinedLobby = false;
let desiredPlayerName = savedName;

if (savedName) {
  nameInput.value = savedName;
}

function initSocketIfNeeded() {
  if (socket) return;

  socket = io(BACKEND_URL, {
    transports: ["websocket", "polling"]
  });

  socket.on("connect", () => {
    connStatusEl.innerText = "🟢 Đã kết nối máy chủ";
    connStatusEl.style.color = "var(--correct)";

    // Kết nối lại sẽ có socket.id mới, nên phải đăng ký lobby lại.
    if (hasJoinedLobby && desiredPlayerName) {
      socket.emit("join_lobby", desiredPlayerName);
    }
  });

  socket.on("disconnect", () => {
    connStatusEl.innerText = "🔴 Mất kết nối máy chủ!";
    connStatusEl.style.color = "var(--wrong)";
  });

  socket.on("lobby_update", players => {
    renderPlayerList(players);
  });

  socket.on("receive_invite", ({ fromId, fromName }) => {
    pendingInviterId = fromId;
    inviterNameEl.innerText = fromName;
    inviteModal.classList.remove("hidden");
  });

  socket.on("invite_rejected", ({ byName }) => {
    alert(`${byName} đã từ chối lời thách đấu của bạn!`);
  });

  socket.on("match_error", msg => {
    alert(msg);
  });

  socket.on("match_start", data => {
    inviteModal.classList.add("hidden");

    currentMatchId = data.matchId;
    pvpQuestions = data.questions;
    currentPvPQIndex = 0;

    document.getElementById("pvp-opponent-name").innerText =
      data.opponentName;

    document.getElementById("pvp-my-score").innerText = "0";
    document.getElementById("pvp-timer").innerText = data.duration;

    nameScreen.classList.add("hidden");
    lobbyScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    matchScreen.classList.remove("hidden");

    renderPvPQuestion();
  });

  socket.on("match_tick", ({ timeLeft }) => {
    document.getElementById("pvp-timer").innerText = timeLeft;
  });

  // Phản hồi chỉ gửi cho người vừa trả lời để giữ chế độ tàng hình.
  socket.on(
    "answer_feedback",
    ({ isCorrect, myCurrentScore, correctAnswer }) => {
      document.getElementById("pvp-my-score").innerText =
        myCurrentScore;

      const msgEl = document.getElementById("pvp-feedback-msg");

      if (isCorrect) {
        msgEl.innerHTML =
          `<span style="color:var(--correct)">🎯 Chuẩn xác! (+1 điểm)</span>`;
      } else {
        msgEl.innerHTML =
          `<span style="color:var(--wrong)">❌ Sai rồi! Đáp án: <b>${correctAnswer}</b></span>`;
      }

      setTimeout(() => {
        currentPvPQIndex++;

        if (currentPvPQIndex < pvpQuestions.length) {
          renderPvPQuestion();
        } else {
          msgEl.innerHTML =
            `<span>⏳ Bạn đã làm hết câu hỏi! Đang chờ đối thủ hoặc hết giờ...</span>`;
        }
      }, 900);
    }
  );

  socket.on("match_end", data => {
    matchScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    const titleEl = document.getElementById("result-title");

    if (data.result === "win") {
      titleEl.innerText = "🏆 BẠN ĐÃ CHIẾN THẮNG!";
      titleEl.style.color = "var(--correct)";
    } else if (data.result === "lose") {
      titleEl.innerText = "💀 BẠN ĐÃ THUA CUỘC!";
      titleEl.style.color = "var(--wrong)";
    } else {
      titleEl.innerText = "🤝 KẾT QUẢ HÒA!";
      titleEl.style.color = "var(--accent)";
    }

    document.getElementById("result-reason").innerText = data.reason;
    document.getElementById("final-my-score").innerText = data.myScore;
    document.getElementById("final-opp-name").innerText = data.opponentName;
    document.getElementById("final-opp-score").innerText = data.opponentScore;
  });

  socket.on("match_abort", msg => {
    alert(msg);

    matchScreen.classList.add("hidden");
    lobbyScreen.classList.remove("hidden");
  });
}

btnJoinLobby.onclick = () => {
  const name = nameInput.value.trim().slice(0, 16);

  if (name.length < 2) {
    alert("Tên hiển thị phải từ 2 ký tự trở lên!");
    return;
  }

  localStorage.setItem("pvp_player_name", name);

  desiredPlayerName = name;
  hasJoinedLobby = true;

  myDisplayNameEl.innerText = name;

  initSocketIfNeeded();

  if (socket.connected) {
    socket.emit("join_lobby", name);
  }

  nameScreen.classList.add("hidden");
  lobbyScreen.classList.remove("hidden");
};

function renderPlayerList(players) {
  playerListEl.innerHTML = "";

  const otherPlayers = players.filter(p => p.id !== socket.id);

  if (otherPlayers.length === 0) {
    playerListEl.innerHTML =
      `<p class="empty-msg">Chưa có ai khác online. Mở thêm 1 tab khác để thử!</p>`;
    return;
  }

  otherPlayers.forEach(p => {
    const row = document.createElement("div");
    row.className = "player-row";

    // Dùng textContent để tránh chèn tên người chơi như HTML.
    const info = document.createElement("span");
    const name = document.createElement("b");

    const statusText =
      p.status === "in_match"
        ? " (⚔️ Đang đấu)"
        : " (🟢 Sẵn sàng)";

    name.textContent = String(p.name || "Người chơi");
    info.append("👤 ", name, statusText);

    const btnInvite = document.createElement("button");
    btnInvite.className = "btn-invite";
    btnInvite.textContent = "Mời Đấu";
    btnInvite.disabled = p.status === "in_match";

    btnInvite.onclick = () => {
      btnInvite.textContent = "Đã gửi...";
      btnInvite.disabled = true;

      socket.emit("invite_player", p.id);
    };

    row.append(info, btnInvite);
    playerListEl.appendChild(row);
  });
}

btnAcceptInvite.onclick = () => {
  inviteModal.classList.add("hidden");

  socket.emit("respond_invite", {
    fromId: pendingInviterId,
    accept: true
  });
};

btnRejectInvite.onclick = () => {
  inviteModal.classList.add("hidden");

  socket.emit("respond_invite", {
    fromId: pendingInviterId,
    accept: false
  });
};

function renderPvPQuestion() {
  const q = pvpQuestions[currentPvPQIndex];

  if (!q) return;

  document.getElementById("pvp-feedback-msg").innerHTML = "";

  document.getElementById("pvp-q-counter").innerText =
    `Câu ${currentPvPQIndex + 1}/${pvpQuestions.length}`;

  document.getElementById("pvp-word-display").innerText = q.word;

  const grid = document.getElementById("pvp-options-grid");
  grid.innerHTML = "";

  q.options.forEach(optText => {
    const btn = document.createElement("button");

    btn.className = "option-btn";
    btn.innerText = optText;

    btn.onclick = () => {
      grid.querySelectorAll(".option-btn").forEach(button => {
        button.disabled = true;
      });

      btn.style.borderColor = "var(--accent)";

      socket.emit("submit_answer", {
        matchId: currentMatchId,
        questionIndex: q.index,
        selectedAnswer: optText
      });
    };

    grid.appendChild(btn);
  });
}

document.getElementById("btn-back-lobby").onclick = () => {
  resultScreen.classList.add("hidden");
  lobbyScreen.classList.remove("hidden");
};