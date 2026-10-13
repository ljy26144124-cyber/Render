const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let profiles = [];   // 등록된 프로필 목록
let matches = [];    // 성사된 매칭/채팅방 목록 [{ matchId, user1, user2 }]
let chatMessages = {}; // matchId별 메시지 배열

// 1. 프로필 및 대기 인원 조회 (현재 채팅/매칭 중인 사람은 대기열에서 자동 제외)
app.get('/api/profiles', (req, res) => {
    const busyUsers = new Set();
    matches.forEach(m => {
        busyUsers.add(m.user1);
        busyUsers.add(m.user2);
    });

    res.json({
        profiles,
        busyUsers: Array.from(busyUsers)
    });
});

// 2. 프로필 카드 등록
app.post('/api/profiles', (req, res) => {
    const { name, gender, tagline, desc, tags, emoji } = req.body;
    
    // 중복 이름 방지 및 갱신
    profiles = profiles.filter(p => p.name !== name);
    
    const newProfile = {
        id: Date.now().toString(),
        name,
        gender,
        tagline,
        desc,
        tags: tags || [],
        emoji: emoji || '😊'
    };

    profiles.push(newProfile);
    res.json({ success: true, profile: newProfile });
});

// 3. 계정 초기화 (프로필 및 관련 매칭 삭제)
app.post('/api/reset', (req, res) => {
    const { name } = req.body;
    profiles = profiles.filter(p => p.name !== name);
    matches = matches.filter(m => m.user1 !== name && m.user2 !== name);
    res.json({ success: true });
});

// 4. 이성 선택 시 즉시 1:1 매칭 및 채팅방 생성 (선택한 2명은 즉시 대기열 제외)
app.post('/api/match', (req, res) => {
    const { myName, targetId } = req.body;
    const targetProfile = profiles.find(p => p.id === targetId);
    const myProfile = profiles.find(p => p.name === myName);

    if (!targetProfile || !myProfile) {
        return res.status(404).json({ success: false, message: "프로필을 찾을 수 없습니다." });
    }

    const matchId = [myProfile.name, targetProfile.name].sort().join('_');

    const existingMatch = matches.find(m => m.matchId === matchId);
    if (!existingMatch) {
        matches.push({
            matchId,
            user1: myProfile.name,
            user2: targetProfile.name
        });
        if (!chatMessages[matchId]) {
            chatMessages[matchId] = [];
        }
    }

    res.json({ success: true, matchId, partnerName: targetProfile.name });
});

// 5. 내 활성 매칭(채팅방) 목록 조회
app.get('/api/matches/:name', (req, res) => {
    const userName = req.params.name;
    const myMatches = matches.filter(m => m.user1 === userName || m.user2 === userName);
    res.json(myMatches);
});

// 6. 채팅 메시지 조회
app.get('/api/chat/:matchId', (req, res) => {
    const { matchId } = req.params;
    res.json(chatMessages[matchId] || []);
});

// 7. 채팅 메시지 전송
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