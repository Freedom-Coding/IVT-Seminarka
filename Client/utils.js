export class Timer
{
    constructor()
    {
        this.currentTime = 0;
        this.intervalId = null;
        this.onTick = null;
    }

    start()
    {
        if (this.intervalId) return;
        this.intervalId = setInterval(() =>
        {
            this.currentTime++;
            if (typeof this.onTick === "function")
            {
                this.onTick(this.currentTime);
            }
        }, 1000);
    }

    stop()
    {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    reset()
    {
        this.stop();
        this.currentTime = 0;
    }

    getTime()
    {
        return this.currentTime;
    }

    getTimeString()
    {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

export class Utils
{
    static formatDuration(duration)
    {
        const min = Math.floor(duration / 60);
        const sec = duration % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    static Delay(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static RandomRange(min, max)
    {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
