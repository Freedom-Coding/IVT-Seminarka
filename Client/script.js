let questions = [];
let currentQuestion;
let currentDailyQuestionIndex;
let dailyQuizQuestions;
let doingDailyQuiz = false;
let dailyQuizCorrectAnswers = 0;

const errorExplanation = document.getElementById("errorExplanation");
const dailyQuizQuestionContainer = document.querySelector(".daily-quiz-question-container");
const leaderboardForm = document.getElementById("leaderboardForm");
const dailyQuizDialog = document.getElementById("dailyQuizDialog");
const dailyQuizDialogScore = document.getElementById("dailyQuizDialogScore");
const dailyQuizDialogTime = document.getElementById("dailyQuizDialogTime");

async function LoadQuestions() 
{
    dailyQuizQuestionContainer.style.display = "none";
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
    const dialogElement = document.querySelector(dialogClass);
    dialogElement.style.display = "block";
    dialogElement.style.transform = doingDailyQuiz ? "translate(-50%, 30%)" : "translate(-50%, -10%)";

    if (currentQuestion.hasError)
    {
        errorExplanation.innerText = currentQuestion.explanation;
    }
}

function IncorrectButton()
{
    const dialogClass = currentQuestion.hasError ? ".dialog-correct" : ".dialog-incorrect";
    const dialogElement = document.querySelector(dialogClass);
    dialogElement.style.display = "block";
    dialogElement.style.transform = doingDailyQuiz ? "translate(-50%, 30%)" : "translate(-50%, -10%)";

    if (!currentQuestion.hasError)
    {
        errorExplanation.innerText = "There are no errors in this code.";
    }
}

function IncorrectDialogButton()
{
    document.querySelector(".dialog-incorrect").style.display = "none";
    ShowNextQuestion(false);
}

function CorrectDialogButton()
{
    document.querySelector(".dialog-correct").style.display = "none"
    ShowNextQuestion(true);
}

function ShowNextQuestion(correctAnswer) 
{
    if (doingDailyQuiz)
    {
        const lastQuestion = dailyQuizQuestionContainer.children[currentDailyQuestionIndex];
        lastQuestion.style.border = "0px";
        if (correctAnswer)
        {
            lastQuestion.style.background = "rgb(43, 153, 43)";
            dailyQuizCorrectAnswers += 1;
        }
        else
        {
            lastQuestion.style.background = "rgb(172, 38, 38)";
        }
        currentDailyQuestionIndex += 1;
        if (currentDailyQuestionIndex >= dailyQuizQuestions.length)
        {
            dailyQuizDialog.style.display = "block";
            dailyQuizDialogScore.textContent = `Score: ${dailyQuizCorrectAnswers / 5 * 100}`;
        }
        else
        {
            dailyQuizQuestionContainer.children[currentDailyQuestionIndex].style.border = "2px solid gray";
            currentQuestion = questions[dailyQuizQuestions[currentDailyQuestionIndex]];
            ShowQuestion(currentQuestion);
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
    dailyQuizCorrectAnswers = 0;
    doingDailyQuiz = true;
    currentDailyQuestionIndex = 0;

    dailyQuizQuestionContainer.style.display = "flex";
    dailyQuizQuestionContainer.children[0].style.border = "2px solid gray";
    const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/dailyQuiz");
    dailyQuizQuestions = await response.json();

    currentQuestion = questions[dailyQuizQuestions[0]];
    ShowQuestion(currentQuestion);
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

    dailyQuizQuestionContainer.style.display = "none";
    ShowRandomQuestion();
    doingDailyQuiz = false;
    dailyQuizDialog.style.display = "none";
    score = dailyQuizCorrectAnswers / 5 * 100;

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

LoadQuestions();
LoadLeaderboard();
AddButtonListeners();