const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 봇이나 샘플 데이터를 절대 생성하지 않고 완전히 빈 배열로 시작합니다.
let profiles = [];
let matches = [];
let chatMessages = {};

// 프로필 목록 조회
app.get('/api/profiles', (req, res) => {
    res.json(profiles);
});

// 프로필 등록 (실제 접속자가 등록할 때만 추가됨)
app.post('/api/profiles', (req, res) => {
    const newProfile = {
        id: Date.now().toString(),
        ...req.body,
        votes: 0
    };
    profiles.push(newProfile);
    res.json({ success: true, profile: newProfile });
});

// 프로필 선택 시 채팅방 개설
app.post('/api/vote', (req, res) => {
    const { winnerId, voterName } = req.body;
    const target = profiles.find(p => p.id == winnerId);
    
    if (target) {
        target.votes += 1;
        const voter = voterName || "익명참여자";
        const matchId = [voter, target.name].sort().join('_');
        
        if (!chatMessages[matchId]) {
            chatMessages[matchId] = [];
        }

        const exists = matches.some(m => m.matchId === matchId);
        if (!exists) {
            matches.push({
                matchId,
                targetName: target.name,
                voterName: voter
            });
        }

        res.json({ success: true, matchId, targetName: target.name });
    } else {
        res.status(404).json({ success: false, message: "Profile not found" });
    }
});

// 내 매칭 목록 조회
app.get('/api/matches/:name', (req, res) => {
    const userName = req.params.name;
    const userMatches = matches.filter(m => m.targetName === userName || m.voterName === userName);
    res.json(userMatches);
});

// 채팅 메시지 조회
app.get('/api/chat/:matchId', (req, res) => {
    const { matchId } = req.params;
    res.json(chatMessages[matchId] || []);
});

// 채팅 메시지 전송
app.post('/api/chat/:matchId', (req, res) => {
    const { matchId } = req.params;
    const { sender, text } = req.body;
    
    if (!chatMessages[matchId]) {
        chatMessages[matchId] = [];
    }
    
    const message = {
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    chatMessages[matchId].push(message);
    res.json({ success: true, message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});