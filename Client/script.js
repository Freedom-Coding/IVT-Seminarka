import { Timer, Utils } from './utils.js';

//Názvy "proměnných" v localStorage
const ANSWERED_QUESTIONS = "answeredQuestions";
const ANSWER_TIME = "answerTime";
const CORRECT_ANSWERS = "correctAnswers";
//Časovač
const timer = new Timer();

let questions = []; //Otázky načtené z JSON
let currentQuestion; //Aktuální otázka
let currentDailyQuestionIndex; //Pořadí aktuální otazky dne (0 až 4) 
let dailyQuizQuestions; //Otázky denního kvízu přijaté ze serveru
let doingDailyQuiz = false; //Vyplňuje aktuálně uživatel denní kvíz?
let dailyQuizCorrectAnswers = 0; //Počet správných odpovědí v denním kvízu
let answeredQuestions = 0; //Celkem odpovězených otázek
let correctAnswers = 0; //Celkem správných odpovědí
let answerTime = 0; //Celkový čas, který uživatel strávil odpovídáním na otázky

//Získání potřebných elementů dle ID
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
const statisticsAnsweredQuestions = document.getElementById("answered-questions");
const statisticsTime = document.getElementById("statistics-time");
const statisticsSuccessRate = document.getElementById("statistics-success-rate");
const loadingScreen = document.getElementById("loading-screen");

//Nastavení funkcí, které se spustí po stisku tlačítek
function AddButtonListeners()
{
    leaderboardForm.addEventListener("submit", SubmitScore);

    document.getElementById("button-correct").addEventListener("click", CorrectButton);
    document.getElementById("button-incorrect").addEventListener("click", IncorrectButton);
    document.getElementById("correct-dialog-button").addEventListener("click", CorrectDialogButton);
    document.getElementById("incorrect-dialog-button").addEventListener("click", IncorrectDialogButton);
    document.getElementById("daily-quiz-button").addEventListener("click", DailyQuizButton);
}

//Inicializace statistik
function InitializeStatistics()
{
    //Načtení statistik z local storage
    answeredQuestions = Number(localStorage.getItem(ANSWERED_QUESTIONS));
    correctAnswers = Number(localStorage.getItem(CORRECT_ANSWERS));
    answerTime = Number(localStorage.getItem(ANSWER_TIME));

    if (answeredQuestions == null || correctAnswers == null || answerTime == null)
    {
        //V případě, že nejsou uloženy žádné statistiky, nastaví se proměnné na 0
        answeredQuestions = 0;
        correctAnswers = 0;
        answerTime = 0;
        localStorage.setItem(ANSWERED_QUESTIONS, 0);
        localStorage.setItem(CORRECT_ANSWERS, 0);
        localStorage.setItem(ANSWER_TIME, 0);
    }
    else if (answeredQuestions != 0)
    {
        //Zobrazení uložených statistik
        UpdateStatistics();
    }
}

//Aktualizace statistik
function UpdateStatistics()
{
    //Uložení nových hodnot statistik
    localStorage.setItem(ANSWERED_QUESTIONS, answeredQuestions);
    localStorage.setItem(CORRECT_ANSWERS, correctAnswers);
    localStorage.setItem(ANSWER_TIME, answerTime);

    //Zobrazení nových hodnot statistik
    statisticsAnsweredQuestions.textContent = `Answered questions: ${answeredQuestions}`;
    statisticsSuccessRate.textContent = `Success rate: ${(correctAnswers / answeredQuestions * 100).toFixed(1)}%`;
    statisticsTime.innerHTML = `Answer time: ${Utils.formatDuration(Math.floor(answerTime / answeredQuestions))}`;
}

//Inicializace otázek
async function LoadQuestions() 
{
    //Vypnutí elementů denního kvízu
    timeCounter.style.display = "none";
    dailyQuizQuestionContainer.style.display = "none";

    //Načtení otázek
    questions = await fetch("./questions.json").then(response => response.json());
    ShowRandomQuestion();
}

//Výběr a zobrazení náhodné otázky
function ShowRandomQuestion()
{
    timer.onTick = null;
    timer.start();
    let randomQuestion = null;

    //Výběr náhodné otázky, která je jiná, než předchozí otázka
    do
    {
        randomQuestion = questions[Utils.RandomRange(0, questions.length)];
    }
    while (randomQuestion == currentQuestion);

    ShowQuestion(randomQuestion);
}

//Zobrazení otázky
function ShowQuestion(question)
{
    currentQuestion = question;
    //Oddělení řádků
    const lines = question.code.split("\n");
    //Přídání čísel řádků
    const formatted = lines
        .map((line, index) => `<span class="line-number">${index + 1}</span>${line}`)
        .join("\n");
    document.getElementById("code-text-field").innerHTML = formatted;
}

//Po stisknutí tlačítka pro správnou odpověď
function CorrectButton()
{
    //Zobrazení dialogu podle toho, zda uživatel odpověděl správně
    ShowQuestionDialog(currentQuestion.hasError ? dialogIncorrect : dialogCorrect);
    //Zobrazení vysvětlivky chyby
    if (currentQuestion.hasError) errorExplanation.innerText = currentQuestion.explanation;
}

//Po stisknutí tlačítka pro špatnou odpověď
function IncorrectButton()
{
    //Zobrazení dialogu podle toho, zda uživatel odpověděl správně
    ShowQuestionDialog(currentQuestion.hasError ? dialogCorrect : dialogIncorrect);
    //Zobrazení vysvětlivky chyby
    if (!currentQuestion.hasError) errorExplanation.innerText = "There are no errors in this code.";
}

//Po stisknutí tlačítka v dialogu při špatné odpovědi
function IncorrectDialogButton()
{
    dialogIncorrect.style.display = "none";
    ShowNextQuestion(false);
}

//Po stisknutí tlačítka v dialogu při správné odpovědi
function CorrectDialogButton()
{
    dialogCorrect.style.display = "none"
    ShowNextQuestion(true);
}

//Zobrazení dialogu po odpovězení na otázku
function ShowQuestionDialog(dialogElement)
{
    if (!doingDailyQuiz)
    {
        //V případě, že si uživatel nevybral denní kvíz, časovač se po každé otázce resetuje
        answerTime += timer.getTime();
        timer.reset();
    }

    //Zobrazení elementu dialogu
    dialogElement.style.display = "block";
    dialogElement.style.transform = doingDailyQuiz ? "translate(-50%, 30%)" : "translate(-50%, -10%)";
}

//Zobrazení další otázky
function ShowNextQuestion(correctAnswer) 
{
    if (doingDailyQuiz)
    {
        const lastQuestion = dailyQuizQuestionContainer.children[currentDailyQuestionIndex];
        lastQuestion.style.border = "0px";

        //Nastavení barvy splněné otázky (zelená - správně, červená - špatně)
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
            //Aktualizace statistik
            answerTime += timer.getTime();
            timer.stop();
            answeredQuestions += 5;
            correctAnswers += dailyQuizCorrectAnswers;
            UpdateStatistics();
            //Zobrazení dialogu po dokončení denního kvízu
            dailyQuizDialog.style.display = "block";
            dailyQuizDialogScore.textContent = `Score: ${dailyQuizCorrectAnswers / 5 * 100}`;
            dailyQuizDialogTime.textContent = `Time: ${timer.getTimeString()}`;
        }
        else
        {
            //Zobrazení další otázky
            dailyQuizQuestionContainer.children[currentDailyQuestionIndex].style.border = "2px solid gray";
            ShowQuestion(questions[dailyQuizQuestions[currentDailyQuestionIndex]]);
        }
    }
    else
    {
        //Zobrazení náhodné otázky v případě, že uživatel nedělá denní kvíz
        ShowRandomQuestion();

        //Aktualizace statistik
        answeredQuestions++;
        if (correctAnswer) correctAnswers++;
        UpdateStatistics();
    }
}

//Po stisknutí tlačítka pro denní kvíz
async function DailyQuizButton()
{
    if (doingDailyQuiz) return;
    doingDailyQuiz = true;
    timer.reset();
    dailyQuizCorrectAnswers = 0;
    currentDailyQuestionIndex = 0;

    //Resetování vizuálu otázek (všechny jsou zatím nesplněné)
    for (let i = 0; i < 5; i++)
    {
        const question = dailyQuizQuestionContainer.children[i];
        question.style.border = "0px";
        question.style.background = "#192029";
    }

    loadingScreen.style.display = "block";

    //Načtení otázek denního kvízu ze serveru
    const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/dailyQuiz");
    dailyQuizQuestions = await response.json();
    timer.onTick = () =>
    {
        //Aktualizace textu časovače
        if (currentDailyQuestionIndex < dailyQuizQuestions.length)
        {
            timeCounter.innerHTML = timer.getTimeString();
        }
    }

    loadingScreen.style.display = "none";
    //Zobrazení vizuálu otázek
    dailyQuizQuestionContainer.style.display = "flex";
    //Zobrazení aktuální otázky
    dailyQuizQuestionContainer.children[0].style.border = "2px solid gray";
    //Zobrazení časovače
    timeCounter.style.display = "block";

    timer.start();

    //Zobrazení první otázky
    ShowQuestion(questions[dailyQuizQuestions[0]]);
}

//Načtení žebříčku uživatelů
async function LoadLeaderboard()
{
    try
    {
        const response = await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard");
        const leaderboardData = await response.json();

        leaderboard.textContent = leaderboardData.length > 0 ? "" : "Nobody did today's quiz.";

        //Zobrazení dat přijatých ze serveru
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

//Uložení skóre do žebříčku
async function SubmitScore()
{
    const formData = new FormData(leaderboardForm);
    let name;
    name = formData.get("fname");

    //Zobrazení další náhodné otázky po splnění denního kvízu
    dailyQuizQuestionContainer.style.display = "none";
    ShowRandomQuestion();
    doingDailyQuiz = false;
    dailyQuizDialog.style.display = "none";
    timeCounter.style.display = "none";
    const score = dailyQuizCorrectAnswers / 5 * 100;

    try
    {
        //Odeslání dat o uživateli serveru (přezdívka, skóre a čas)
        await fetch("https://ivt-seminarka.uc.r.appspot.com/leaderboard",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, score, time: timer.currentTime })
            });

        //Načtení žebříčku s přidaným uživatelem
        LoadLeaderboard();
    }
    catch (err)
    {
        console.error("Failed to submit score.", err);
    }

    timer.reset();
}

//Inicializace
InitializeStatistics();
LoadQuestions();
LoadLeaderboard();
AddButtonListeners();