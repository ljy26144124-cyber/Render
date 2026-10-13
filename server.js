const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 메모리 상의 프로필 데이터베이스 (실제 운영 시 DB 연동 가능)
let profiles = [
    { id: 1, name: "햇살댕댕이", gender: "여", tagline: "웃음이 많고 칼답이 특기인 사람", desc: "주말에 예쁜 카페 가는 걸 좋아해요!", emoji: "🐶", tags: ["#외향적", "#칼답"], affection: 90, empathy: 85, humor: 80, votes: 0 },
    { id: 2, name: "새벽감성피아니스트", gender: "여", tagline: "음악과 영화를 사랑하는 감성러", desc: "조용히 대화 나누는 걸 좋아합니다.", emoji: "🎹", tags: ["#내향적", "#감성"], affection: 80, empathy: 95, humor: 65, votes: 0 },
    { id: 3, name: "프로일잘러J", gender: "남", tagline: "데이트 코스 완벽 리드하는 든든이", desc: "계획적이고 센스 있어요!", emoji: "📅", tags: ["#계획적", "#든든함"], affection: 75, empathy: 80, humor: 75, votes: 0 },
    { id: 4, name: "배꼽도둑개그캐", gender: "남", tagline: "지루할 틈 없는 티키타카 메이커", desc: "세상에서 가장 웃긴 베프가 되어드릴게요.", emoji: "🎭", tags: ["#유머왕", "#티키타카"], affection: 85, empathy: 75, humor: 100, votes: 0 }
];

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
    const target = profiles.find(p => p.id === id);
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