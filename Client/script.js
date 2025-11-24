let questions = [];
let currentQuestion;
let dailyQuizQuestions;
let doingDailyQuiz = false;

const errorExplanation = document.getElementById("errorExplanation");
const quizQuestionCounter = document.getElementById("currentQuizQuestion");
const leaderboardForm = document.getElementById("leaderboardForm");

async function LoadQuestions() 
{
    quizQuestionCounter.style.display = "none";
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
    ShowQuestion(currentQuestion);
}

function ShowQuestion(question)
{
    const lines = question.code.split("\n");
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
    document.getElementById("leaderboardForm").addEventListener("submit", SubmitScore);
}

function CorrectButton()
{
    const dialogClass = currentQuestion.hasError ? ".dialog-incorrect" : ".dialog-correct";
    document.querySelector(dialogClass).style.display = "block";

    if (currentQuestion.hasError)   
    {
        errorExplanation.innerText = currentQuestion.explanation;
    }
}

function IncorrectButton()
{
    const dialogClass = currentQuestion.hasError ? ".dialog-correct" : ".dialog-incorrect";
    document.querySelector(dialogClass).style.display = "block";

    if (!currentQuestion.hasError)
    {
        errorExplanation.innerText = "There are no errors in this code.";
    }
}

function IncorrectDialogButton()
{
    document.querySelector(".dialog-incorrect").style.display = "none";
    ShowNextQuestion();
}

function CorrectDialogButton()
{
    document.querySelector(".dialog-correct").style.display = "none"
    ShowNextQuestion();
}

function ShowNextQuestion() 
{
    if (doingDailyQuiz)
    {
        currentQuestion += 1;
        quizQuestionCounter.textContent = `Current quiz question: ${currentQuestion + 1}`;
        if (currentQuestion >= dailyQuizQuestions.length)
        {
            quizQuestionCounter.style.display = "none";
            ShowRandomQuestion();
            doingDailyQuiz = false;
            leaderboardForm.style.display = "block";
        }
        else
        {
            const questionIndex = dailyQuizQuestions[currentQuestion];
            ShowQuestion(questions[questionIndex]);
        }
    }
    else
    {
        ShowRandomQuestion();
    }
}

async function DailyQuizButton()
{
    if (doingDailyQuiz) return;

    currentQuestion = 0;
    quizQuestionCounter.style.display = "block";
    quizQuestionCounter.textContent = `Current quiz question: ${currentQuestion + 1}`;
    const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/dailyQuiz");
    dailyQuizQuestions = await response.json();
    doingDailyQuiz = true;

    const dailyQuestionIndex = dailyQuizQuestions[0];
    ShowQuestion(questions[dailyQuestionIndex]);
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

async function SubmitScore()
{
    const formData = new FormData(leaderboardForm);
    let name;
    name = formData.get("fname");

    leaderboardForm.style.display = "none";
    score = 100;

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