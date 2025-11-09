let questions = [];
let currentQuestion;

async function LoadQuestions() 
{
    questions = await fetch("./questions.json")
        .then(response => response.json());

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
    let lines = currentQuestion.code.split("\n");
    let formatted = lines
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
}

function CorrectButton()
{
    let dialogClass = currentQuestion.hasError ? ".dialog-incorrect" : ".dialog-correct";
    document.querySelector(dialogClass).classList.add("show");

    if (currentQuestion.hasError)   
    {
        document.getElementById("errorExplanation").innerText = currentQuestion.explanation;
    }
}

function IncorrectButton()
{
    let dialogClass = currentQuestion.hasError ? ".dialog-correct" : ".dialog-incorrect";
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

function RandomRange(min, max)
{
    return Math.floor(Math.random() * (max - min)) + min;
}

function Delay(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadLeaderboard()
{
    try
    {
        let response = await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard");
        let leaderboard = await response.json();

        let container = document.getElementById("leaderboard");
        container.innerHTML = "<h1>Leaderboard</h1>";

        leaderboard.forEach((entry, index) =>
        {
            let div = document.createElement("h1");
            div.textContent = `${index + 1}. ${entry.name} - ${entry.score}`;
            container.appendChild(div);
        });
    } catch (err)
    {
        console.error("Failed to load leaderboard:", err);
    }
}

loadLeaderboard();
LoadQuestions();
AddButtonListeners();