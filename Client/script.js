let questions = [];
let currentQuestion;

async function LoadQuestions() 
{
    questions = await fetch("./questions.json").then(response => response.json());

    ShowRandomQuestion();
}

function ShowRandomQuestion()
{
    let randomQuestion = null;
    do
    {
        randomQuestion = questions[RandomRange(0, questions.length)];
    }
    while (randomQuestion == currentQuestion);

    currentQuestion = randomQuestion;
    const lines = currentQuestion.code.split("\n");
    const formatted = lines
        .map((line, index) => `<span class="line-number">${index + 1}</span>${line}`)
        .join("\n");
    document.querySelector(".code-text-field").innerHTML = formatted;
}

function AddButtonListeners()
{
    document.querySelector(".button-correct").addEventListener("click", CorrectButton);
    document.querySelector(".button-incorrect").addEventListener("click", IncorrectButton);
    document.getElementById("correctDialogButton").addEventListener("click", CorrectDialogButton);
    document.getElementById("incorrectDialogButton").addEventListener("click", IncorrectDialogButton);
    document.getElementById("dailyQuizButton").addEventListener("click", DailyQuizButton);
}

function CorrectButton()
{
    const dialogClass = currentQuestion.hasError ? ".dialog-incorrect" : ".dialog-correct";
    document.querySelector(dialogClass).classList.add("show");

    if (currentQuestion.hasError)   
    {
        document.getElementById("errorExplanation").innerText = currentQuestion.explanation;
    }
}

function IncorrectButton()
{
    const dialogClass = currentQuestion.hasError ? ".dialog-correct" : ".dialog-incorrect";
    document.querySelector(dialogClass).classList.add("show");

    if (!currentQuestion.hasError)
    {
        document.getElementById("errorExplanation").innerText = "There are no errors in this code.";
    }
}

function IncorrectDialogButton()
{
    document.querySelector(".dialog-incorrect").classList.remove("show");
    ShowRandomQuestion();
}

function CorrectDialogButton()
{
    document.querySelector(".dialog-correct").classList.remove("show");
    ShowRandomQuestion();
}

async function DailyQuizButton()
{
    const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/dailyQuiz");
    const data = await response.json();
    console.log(data);
}

async function LoadLeaderboard()
{
    try
    {
        const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard");
        const leaderboardData = await response.json();

        const container = document.querySelector(".leaderboard");

        leaderboardData.forEach((entry, index) =>
        {
            const div = document.createElement("div");
            div.textContent = `${index + 1}. ${entry.name} - ${entry.score}`;
            container.appendChild(div);
        });
    }
    catch (err)
    {
        console.error("Failed to load leaderboard.", err);
    }
}

async function SubmitScore(name, score)
{
    try
    {
        await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, score })
            });
    }
    catch (err)
    {
        console.error("Failed to submit score.", err);
    }
}

function RandomRange(min, max)
{
    return Math.floor(Math.random() * (max - min)) + min;
}

function Delay(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

LoadLeaderboard();
LoadQuestions();
AddButtonListeners();