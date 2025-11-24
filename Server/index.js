const express = require("express");
const cors = require("cors");
const { Storage } = require("@google-cloud/storage");

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());

const storage = new Storage(
    {
        keyFilename: "./ivt-seminarka-b84956c46406.json",
        projectId: "ivt-seminarka"
    });

const storageBucket = storage.bucket("ivt_seminarka");
const leaderboardFile = storageBucket.file("leaderboard.json");
const dailyQuizFile = storageBucket.file("dailyQuiz.json");
const questionsFile = storageBucket.file("questions.json");

let questions = null;
let leaderboard = [];
let dailyQuiz = null;

app.listen(PORT, (err) =>
{
    if (!err) 
    {
        LoadQuestions();
        LoadLeaderboard();
    }
});

app.get("/leaderboard", (req, res) =>
{
    res.json(leaderboard);
});

app.post("/leaderboard", async (req, res) =>
{
    let { name, score } = req.body;

    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);

    await leaderboardFile.save(JSON.stringify(leaderboard), { contentType: "application/json" });

    res.send("Leaderboard score posted.");
});

app.get("/dailyQuiz", async (req, res) =>
{
    if (dailyQuiz == null)
    {
        const [data] = await dailyQuizFile.download();
        dailyQuiz = JSON.parse(data);

        if (dailyQuiz.length == 0)
        {
            GenerateDailyQuiz();
        }
    }

    res.json(dailyQuiz);
});

async function GenerateDailyQuiz()
{
    dailyQuiz = [];
    const questionsCount = 5;

    for (let i = 0; i < questionsCount; i++)
    {
        const questionIndex = RandomRange(0, questions.length);
        dailyQuiz.push(questionIndex);
    }

    await dailyQuizFile.save(JSON.stringify(dailyQuiz), { contentType: "application/json" });
}

async function LoadQuestions()
{
    const [data] = await questionsFile.download();
    questions = JSON.parse(data.toString());
}

async function LoadLeaderboard()
{
    const [data] = await leaderboardFile.download();
    leaderboard = JSON.parse(data.toString());
}

function RandomRange(min, max)
{
    return Math.floor(Math.random() * (max - min)) + min;
}