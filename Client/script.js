let questions = [];
let currentQuestion;
let currentDailyQuestionIndex;
let dailyQuizQuestions;
let doingDailyQuiz = false;
let dailyQuizCorrectAnswers = 0;
let currentTimer = 0;

const dailyQuizQuestionContainer = document.getElementById("daily-quiz-question-container");
const errorExplanation = document.getElementById("errorExplanation");
const leaderboardForm = document.getElementById("leaderboardForm");
const dailyQuizDialog = document.getElementById("dailyQuizDialog");
const dailyQuizDialogScore = document.getElementById("dailyQuizDialogScore");
const dailyQuizDialogTime = document.getElementById("dailyQuizDialogTime");
const timeCounter = document.getElementById("timeCounter");
const dialogIncorrect = document.getElementById("dialog-incorrect");
const dialogCorrect = document.getElementById("dialog-correct");
const leaderboard = document.getElementById("leaderboard");

function AddButtonListeners()
{
    leaderboardForm.addEventListener("submit", SubmitScore);

    document.querySelector(".button-correct").addEventListener("click", CorrectButton);
    document.querySelector(".button-incorrect").addEventListener("click", IncorrectButton);
    document.getElementById("correctDialogButton").addEventListener("click", CorrectDialogButton);
    document.getElementById("incorrectDialogButton").addEventListener("click", IncorrectDialogButton);
    document.getElementById("dailyQuizButton").addEventListener("click", DailyQuizButton);
}

async function LoadQuestions() 
{
    timeCounter.style.display = "none";
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

    ShowQuestion(randomQuestion);
}

function ShowQuestion(question)
{
    currentQuestion = question;
    const lines = question.code.split("\n");
    const formatted = lines
        .map((line, index) => `<span class="line-number">${index + 1}</span>${line}`)
        .join("\n");
    document.getElementById("code-text-field").innerHTML = formatted;
}

function CorrectButton()
{
    ShowQuestionDialog(currentQuestion.hasError ? dialogIncorrect : dialogCorrect);
    if (currentQuestion.hasError) errorExplanation.innerText = currentQuestion.explanation;
}

function IncorrectButton()
{
    ShowQuestionDialog(currentQuestion.hasError ? dialogCorrect : dialogIncorrect);
    if (!currentQuestion.hasError) errorExplanation.innerText = "There are no errors in this code.";
}

function ShowQuestionDialog(dialogElement)
{
    dialogElement.style.display = "block";
    dialogElement.style.transform = doingDailyQuiz ? "translate(-50%, 30%)" : "translate(-50%, -10%)";
}

function IncorrectDialogButton()
{
    dialogIncorrect.style.display = "none";
    ShowNextQuestion(false);
}

function CorrectDialogButton()
{
    dialogCorrect.style.display = "none"
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
            ShowQuestion(questions[dailyQuizQuestions[currentDailyQuestionIndex]]);
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
    doingDailyQuiz = true;
    dailyQuizCorrectAnswers = 0;
    currentDailyQuestionIndex = 0;

    dailyQuizQuestionContainer.style.display = "flex";
    dailyQuizQuestionContainer.children[0].style.border = "2px solid gray";
    const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/dailyQuiz");
    dailyQuizQuestions = await response.json();
    UpdateTimer();

    ShowQuestion(questions[dailyQuizQuestions[0]]);
}

async function UpdateTimer()
{
    timeCounter.style.display = "block";
    currentTimer = 0;

    while (currentDailyQuestionIndex < dailyQuizQuestions.length)
    {
        await Delay(1000);
        currentTimer++;
        timeCounter.innerHTML = GetDurationString(currentTimer);
    }
}

async function LoadLeaderboard()
{
    try
    {
        const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard");
        const leaderboardData = await response.json();

        leaderboardData.forEach((entry, index) =>
        {
            const div = document.createElement("div");
            div.textContent = `${index + 1}. ${entry.name} - ${entry.score}% - ${GetDurationString(entry.time)}`;
            leaderboard.appendChild(div);
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
    timeCounter.style.display = "none";
    score = dailyQuizCorrectAnswers / 5 * 100;

    try
    {
        await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, score, time: currentTimer })
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

function GetDurationString(duration)
{
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

LoadQuestions();
LoadLeaderboard();
AddButtonListeners();