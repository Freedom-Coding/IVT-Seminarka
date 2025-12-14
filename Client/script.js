import { Utils } from './utils.js';

const ANSWERED_QUESTIONS = "answeredQuestions";
const ANSWER_TIME = "answerTime";
const CORRECT_ANSWERS = "correctAnswers";
const timer = new Utils.Timer();

let questions = [];
let currentQuestion;
let currentDailyQuestionIndex;
let dailyQuizQuestions;
let doingDailyQuiz = false;
let dailyQuizCorrectAnswers = 0;
let answeredQuestions = 0;
let correctAnswers = 0;
let answerTime = 0;

const dailyQuizQuestionContainer = document.getElementById("daily-quiz-question-container");
const errorExplanation = document.getElementById("error-explanation");
const leaderboardForm = document.getElementById("leaderboard-form");
const dailyQuizDialog = document.getElementById("daily-quiz-dialog");
const dailyQuizDialogScore = document.getElementById("daily-quiz-dialog-score");
const dailyQuizDialogTime = document.getElementById("daily-quiz-dialog-time");
const timeCounter = document.getElementById("time-counter");
const dialogIncorrect = document.getElementById("dialog-incorrect");
const dialogCorrect = document.getElementById("dialog-correct");
const leaderboard = document.getElementById("leaderboard");
const statisticsTime = document.getElementById("statistics-time");
const statisticsSuccessRate = document.getElementById("statistics-success-rate");

function AddButtonListeners()
{
    leaderboardForm.addEventListener("submit", SubmitScore);

    document.querySelector(".button-correct").addEventListener("click", CorrectButton);
    document.querySelector(".button-incorrect").addEventListener("click", IncorrectButton);
    document.getElementById("correct-dialog-button").addEventListener("click", CorrectDialogButton);
    document.getElementById("incorrect-dialog-button").addEventListener("click", IncorrectDialogButton);
    document.getElementById("daily-quiz-button").addEventListener("click", DailyQuizButton);
}

function InitializeStatistics()
{
    answeredQuestions = Number(localStorage.getItem(ANSWERED_QUESTIONS));
    correctAnswers = Number(localStorage.getItem(CORRECT_ANSWERS));
    answerTime = Number(localStorage.getItem(ANSWER_TIME));

    if (answeredQuestions == null || correctAnswers == null || answerTime == null)
    {
        answeredQuestions = 0;
        correctAnswers = 0;
        answerTime = 0;
        localStorage.setItem(ANSWERED_QUESTIONS, 0);
        localStorage.setItem(CORRECT_ANSWERS, 0);
        localStorage.setItem(ANSWER_TIME, 0);
    }
    else if (answeredQuestions != 0)
    {
        UpdateStatistics();
    }
}

function UpdateStatistics()
{
    localStorage.setItem(ANSWERED_QUESTIONS, answeredQuestions);
    localStorage.setItem(CORRECT_ANSWERS, correctAnswers);
    localStorage.setItem(ANSWER_TIME, answerTime);
    statisticsSuccessRate.textContent = `Success rate: ${(correctAnswers / answeredQuestions * 100).toFixed(1)}%`;
    statisticsTime.innerHTML = Utils.formatDuration(Math.floor(answerTime / answeredQuestions));
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
    timer.onTick = null;
    timer.start();
    let randomQuestion = null;
    do
    {
        randomQuestion = questions[Utils.RandomRange(0, questions.length)];
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
    if (!doingDailyQuiz)
    {
        answerTime += timer.getTime();
        timer.reset();
    }

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
    answeredQuestions++;
    if (correctAnswer) correctAnswers++;
    UpdateStatistics();

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
            answerTime += timer.getTime();
            timer.reset();
            dailyQuizDialog.style.display = "block";
            dailyQuizDialogScore.textContent = `Score: ${dailyQuizCorrectAnswers / 5 * 100}`;
            dailyQuizDialogTime.textContent = `Time: ${timer.getTimeString()}`;
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
    timer.reset();
    dailyQuizCorrectAnswers = 0;
    currentDailyQuestionIndex = 0;
    for (let i = 0; i < 5; i++)
    {
        const question = dailyQuizQuestionContainer.children[i];
        question.style.border = "0px";
        question.style.background = "#192029";
    }

    dailyQuizQuestionContainer.style.display = "flex";
    dailyQuizQuestionContainer.children[0].style.border = "2px solid gray";
    timeCounter.style.display = "block";

    const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/dailyQuiz");
    dailyQuizQuestions = await response.json();
    timer.onTick = () =>
    {
        if (currentDailyQuestionIndex < dailyQuizQuestions.length)
        {
            timeCounter.innerHTML = timer.getTimeString();
        }
    }
    timer.start();

    ShowQuestion(questions[dailyQuizQuestions[0]]);
}

async function LoadLeaderboard()
{
    try
    {
        const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard");
        const leaderboardData = await response.json();

        leaderboard.textContent = leaderboardData.length > 0 ? "" : "Nobody did today's quiz.";

        leaderboardData.forEach((entry, index) =>
        {
            const content = `${index + 1}. ${entry.name} - ${entry.score}% - ${Utils.formatDuration(entry.time)}`;
            leaderboard.textContent += content + "\n";
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
    const score = dailyQuizCorrectAnswers / 5 * 100;

    try
    {
        await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, score, time: timer.currentTime })
            });

        LoadLeaderboard();
    }
    catch (err)
    {
        console.error("Failed to submit score.", err);
    }
}

InitializeStatistics();
LoadQuestions();
LoadLeaderboard();
AddButtonListeners();