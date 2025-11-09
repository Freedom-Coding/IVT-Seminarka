let express = require("express");
let cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let leaderboard = [
    { name: "Alice", score: 100 },
    { name: "Bob", score: 80 }
];

app.get("/leaderboard", (req, res) =>
{
    res.json(leaderboard);
});

app.post("/leaderboard", (req, res) =>
{
    let { name, score } = req.body;
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    res.json({ success: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
