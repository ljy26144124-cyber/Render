const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 봇/샘플 프로필을 모두 제거하고 빈 배열로 시작합니다.
let profiles = [];

// 프로필 목록 조회 API
app.get('/api/profiles', (req, res) => {
    res.json(profiles);
});

// 프로필 등록 API
app.post('/api/profiles', (req, res) => {
    const newProfile = {
        id: Date.now(),
        ...req.body,
        votes: 0
    };
    profiles.push(newProfile);
    res.json({ success: true, profile: newProfile });
});

// 투표(우승) 기록 API
app.post('/api/vote', (req, res) => {
    const { id } = req.body;
    const target = profiles.find(p => p.id == id);
    if (target) {
        target.votes += 1;
        res.json({ success: true, votes: target.votes });
    } else {
        res.status(404).json({ success: false, message: "Profile not found" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});