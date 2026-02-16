//Knihovna express pro zjednodušení odesílání a přijímání dat
const express = require("express");
//Knihovna cors předchází errorům na straně klienta týkajích se blokování požadavků
const cors = require("cors");
//Google Storage pro ukládání dat
const { Storage } = require("@google-cloud/storage");

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());

//Konfigurace Google Storage
const storage = new Storage(
    {
        keyFilename: "./ivt-seminarka-b84956c46406.json",
        projectId: "ivt-seminarka"
    });

//Složka se soubory na Google Cloud Storage
const storageBucket = storage.bucket("ivt_seminarka");
//Jednotlivé soubory ve složce
const leaderboardFile = storageBucket.file("leaderboard.json");
const dailyQuizFile = storageBucket.file("dailyQuiz.json");
const questionsFile = storageBucket.file("questions.json");

//Pole všech otázek z JSON souboru
let questions = null;
//Pole obsahující uživatele v žebříčku (každý má přezdívku, procentuální úspěšnost a čas)
let leaderboard = [];
//Pole indexů otázek z denního kvízu
let dailyQuiz = null;

//Inicializace - načtení otázek a žebříčku uživatelů
app.listen(PORT, (err) =>
{
    if (!err) 
    {
        LoadQuestions();
        LoadLeaderboard();
    }
});

//Odeslání žebříčku uživateli
app.get("/leaderboard", (req, res) =>
{
    res.json(leaderboard);
});

//Uložení nového uživatele do žebříčku
app.post("/leaderboard", async (req, res) =>
{
    let { name, score, time } = req.body;

    leaderboard.push({ name, score, time });
    //Seřazení žebříčku podle skóre
    leaderboard.sort((a, b) =>
    {
        const scoreDelta = b.score - a.score;
        if (scoreDelta !== 0) return scoreDelta;

        //Pokud je skóre dvou uživatelů stejné, řadí se dle času
        return a.time - b.time;
    });

    //Uložení do souboru v Google Cloud Storage
    await leaderboardFile.save(JSON.stringify(leaderboard), { contentType: "application/json" });

    res.send("Leaderboard score posted.");
});

//Odeslání otázek denního kvízu uživateli
app.get("/dailyQuiz", async (req, res) =>
{
    if (dailyQuiz == null)
    {
        const [metadata] = await dailyQuizFile.getMetadata();

        //Datum a čas poslední úpravy souboru
        const updatedDate = new Date(metadata.updated);
        //Aktuální datum a čas
        const now = new Date();

        const msInOneDay = 24 * 60 * 60 * 1000;
        const isOlderThanOneDay = (now - updatedDate) > msInOneDay;

        //Kontrola stáří souboru obsahující denní kvíz
        if (isOlderThanOneDay)
        {
            //Pokud je kvíz starší než jeden den -> generace nového kvízu
            await GenerateDailyQuiz();
        }
        else
        {
            //Stažení souboru s kvízem
            const [contents] = await dailyQuizFile.download();
            dailyQuiz = JSON.parse(contents);
        }
    }

    res.json(dailyQuiz);
});

//Vytvoření nového denního kvízu
async function GenerateDailyQuiz()
{
    dailyQuiz = [];
    const questionsCount = 5;

    for (let i = 0; i < questionsCount; i++)
    {
        //Náhodný index otázky
        let questionIndex = RandomRange(0, questions.length);
        //Pokud kvíz již otázku obsahuje, vybere jinou
        while (dailyQuiz.includes(questionIndex))
        {
            questionIndex = RandomRange(0, questions.length);
        }
        dailyQuiz.push(questionIndex);
    }

    //Uložení souboru s denním kvízem
    await dailyQuizFile.save(JSON.stringify(dailyQuiz), { contentType: "application/json" });

    //Resetování žebříčku uživatelů a jeho uložení
    leaderboard = [];
    await leaderboardFile.save(JSON.stringify(leaderboard), { contentType: "application/json" });
}

//Načtení všech otázek z JSON souboru
async function LoadQuestions()
{
    const [data] = await questionsFile.download();
    questions = JSON.parse(data.toString());
}

//Načtení žebříčku uživatelů
async function LoadLeaderboard()
{
    const [data] = await leaderboardFile.download();
    leaderboard = JSON.parse(data.toString());
}

//Vybrání náhodné hodnoty mezi minimální a maximální mezí
function RandomRange(min, max)
{
    return Math.floor(Math.random() * (max - min)) + min;
}