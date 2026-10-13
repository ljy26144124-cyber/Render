const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let profiles = [];   // 등록된 프로필 목록
let matches = [];    // 성사된 매칭/채팅방 목록 [{ matchId, user1, user2 }]
let chatMessages = {}; // matchId별 메시지 배열

// 1. 프로필 및 대기 인원 조회
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

// 3. 계정 초기화
app.post('/api/reset', (req, res) => {
    const { name } = req.body;
    profiles = profiles.filter(p => p.name !== name);
    matches = matches.filter(m => m.user1 !== name && m.user2 !== name);
    res.json({ success: true });
});

// 4. 이성 선택 시 즉시 1:1 매칭 및 채팅방 생성
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

// 7. 채팅 메시지 전송 (⭐️ 서버 환경 구애받지 않는 확실한 한국 시간(UTC+9) 계산 적용)
app.post('/api/chat/:matchId', (req, res) => {
    const { matchId } = req.params;
    const { sender, text } = req.body;

    if (!chatMessages[matchId]) {
        chatMessages[matchId] = [];
    }

    // 현재 UTC 시간에 9시간을 더해 한국 시간(KST)을 직접 계산합니다.
    const now = new Date();
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    let hours = kstTime.getUTCHours();
    const minutes = kstTime.getUTCMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0시는 12시로 표시
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    const timeString = `${ampm} ${hours}:${minutesStr}`;

    const message = {
        sender,
        text,
        time: timeString
    };

    chatMessages[matchId].push(message);
    res.json({ success: true, message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});