//Pomocná třída pro měření času
export class Timer
{
    constructor()
    {
        this.currentTime = 0;
        this.intervalId = null;
        this.onTick = null;
    }

    //Zapnutí časovače
    start()
    {
        //Časovač nelze spustit, pokud již běží
        if (this.intervalId) return;

        //Interval, který každou vteřinu přičte čas a spustí funkci přiřazenou k onTick
        this.intervalId = setInterval(() =>
        {
            this.currentTime++;
            this.onTick?.(this.currentTime);
        }, 1000);
    }

    //Zastavení časovače
    stop()
    {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    //Resetování časovače
    reset()
    {
        this.stop();
        this.currentTime = 0;
    }

    //Získání aktuálního času
    getTime()
    {
        return this.currentTime;
    }

    //Získání aktuálního času ve formátu stringu
    getTimeString()
    {
        return Utils.formatDuration(this.currentTime);
    }
}

//Třída s pomocnými funkcemi
export class Utils
{
    //Formátování času v sekundách do stringu (minuty:sekundy)
    static formatDuration(duration)
    {
        const min = Math.floor(duration / 60);
        const sec = duration % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    //Asynchronní funkce, která počká daný počet ms
    static Delay(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //Generování náhodného čísla v rozmezí min a max
    static RandomRange(min, max)
    {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
