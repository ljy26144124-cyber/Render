const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let profiles = []; // 봇 없이 깨끗한 상태로 시작
let matches = [];  // 매칭된 기록 저장
let chatMessages = {}; // 채팅방 ID별 메시지 저장

// 프로필 목록 조회
app.get('/api/profiles', (req, res) => {
    res.json(profiles);
});

// 프로필 등록
app.post('/api/profiles', (req, res) => {
    const newProfile = {
        id: Date.now().toString(),
        ...req.body,
        votes: 0
    };
    profiles.push(newProfile);
    res.json({ success: true, profile: newProfile });
});

// 투표(우승 선택) 시 매칭 및 채팅방 생성
app.post('/api/vote', (req, res) => {
    const { winnerId, voterName } = req.body;
    const target = profiles.find(p => p.id == winnerId);
    
    if (target) {
        target.votes += 1;
        const voter = voterName || "익명참여자";
        
        // 두 사람의 이름 조합으로 고유한 채팅방 ID 생성 (순서 상관없이 동일한 방 보장)
        const matchId = [voter, target.name].sort().join('_');
        
        if (!chatMessages[matchId]) {
            chatMessages[matchId] = [];
        }

        // 매칭 목록에 추가 (중복 방지)
        const exists = matches.some(m => m.matchId === matchId);
        if (!exists) {
            matches.push({
                matchId,
                targetName: target.name, // 선택받은 사람
                voterName: voter         // 선택한 사람 (투표자)
            });
        }

        res.json({ success: true, matchId, targetName: target.name });
    } else {
        res.status(404).json({ success: false, message: "Profile not found" });
    }
});

// 특정 사용자의 매칭(채팅방) 목록 가져오기
app.get('/api/matches/:name', (req, res) => {
    const userName = req.params.name;
    const userMatches = matches.filter(m => m.targetName === userName || m.voterName === userName);
    res.json(userMatches);
});

// 특정 채팅방 메시지 조회
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