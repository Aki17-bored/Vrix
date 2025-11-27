// Vrix – motivational quote with "quote of the day" & typing effect

const MOTIVATION_QUOTES = [
  `"The more you think the more you fall" - Ayaan`,
  "“Discipline is the soul of an army. It makes small numbers formidable; procures success to the weak, and esteem to all.” – George Washington",
  "“We must all suffer one of two things: the pain of discipline or the pain of regret.” – Jim Rohn",
  "“Discipline is the bridge between goals and accomplishment.” – Jim Rohn",
  "“Discipline is doing what you really don’t want to do so you can do what you really want to do.” – Jeff Fisher",
  "“Without self-discipline, success is impossible, period.” – Lou Holtz",
  "“The first and best victory is to conquer self.” – Plato",
  "“It is not the mountain we conquer, but ourselves.” – Sir Edmund Hillary",
  "“Rule your mind or it will rule you.” – Horace",
  "“Your success is determined by what you do when no one is watching.” – John Wooden",
  "“Discipline is remembering what you want.” – David Campbell",
  "“By constant self-discipline and self-control, you can develop greatness of character.” – Grenville Kleiser",
  "“Through discipline comes freedom.” – Aristotle",
  "“I count him braver who overcomes his desires than him who conquers his enemies, for the hardest victory is over self.” – Aristotle",
  "“Your future is created by what you do today, not tomorrow.” – Robert Kiyosaki",
  "“Discipline is the refining fire by which talent becomes ability.” – Roy L. Smith",
  "“It takes discipline not to let social media steal your time.” – Alexis Ohanian",
  "“No man is free who cannot command himself.” – Pythagoras",
  "“You have power over your mind—not outside events. Realize this, and you will find strength.” – Marcus Aurelius",
  "“Self-control is strength. Right thought is mastery. Calmness is power.” – James Allen",
  "“To discipline your mind is to set yourself free.” – Marcus Aurelius",
  "“If you do not conquer self, you will be conquered by self.” – Napoleon Hill",
  "“With self-discipline, most anything is possible.” – Theodore Roosevelt",
  "“It is easier to discipline yourself now than to regret your lack of discipline later.” – Darren Hardy",
  "“A disciplined life is a choice, not a chance.” – Stephen R. Covey",
  "“We do today what they won’t, so tomorrow we can accomplish what they can’t.” – Jerry Rice",
  "“Discipline is the foundation upon which all success is built. Lack of discipline inevitably leads to failure.” – Jim Rohn",
  "“Success doesn’t just happen. It is built on discipline, consistency, and hard work.” – Darren Hardy",
  "“Self-discipline is the key to personal greatness.” – Brian Tracy",
  "“Your level of success is determined by your level of discipline and perseverance.” – David Goggins",
  "“You will never always be motivated, so you must learn to be disciplined.” – Tim Grover",
  "“Discipline is the key that unlocks the door to success.” – John Wooden",
  "“Dreams don’t work unless you do.” – John C. Maxwell",
  "“The difference between the successful and the unsuccessful is discipline.” – Ed Mylett",
  "“Self-discipline begins with the mastery of your thoughts. If you can’t control what you think, you can’t control what you do.” – Napoleon Hill",
  "“Success is nothing more than a few simple disciplines, practiced every day.” – Jim Rohn",
  "“In reading the lives of great men, I found that the first victory they won was over themselves.” – Harry S. Truman",
  "“Discipline is the bridge between goals and accomplishments.” – Harvey Mackay",
  "“If you want to be successful, discipline is non-negotiable.” – Jocko Willink",
  "“There is no magic to achievement. It’s really about hard work, choices, and persistence.” – Michelle Obama",
  "“A disciplined person is a successful person in disguise.” – Steve Pavlina",
  "“The price of discipline is always less than the pain of regret.” – Robin Sharma",
  "“Success isn’t about how much talent you have; it’s about how much discipline you apply.” – Inky Johnson",
  "“Hard work, dedication, and discipline separate the best from the rest.” – Kobe Bryant",
  "“Without self-discipline, success is impossible.” – Lou Holtz",
  "“It is our choices that show what we truly are, far more than our abilities.” – J.K. Rowling",
  "“Success isn’t owned. It’s leased, and rent is due every day.” – J.J. Watt",
  "“Discipline is doing what needs to be done, even when you don’t feel like doing it.” – Anonymous",
  "“Winners embrace discipline, while losers see it as punishment.” – Larry Winget",
  "“To achieve success, discipline your mind and your habits.” – Mark Divine",
  "“Success doesn’t come from what you do occasionally, but from what you do consistently.” – Marie Forleo"
];

const QUOTE_TEXT_KEY = "vrix.quoteText";
const QUOTE_DATE_KEY = "vrix.quoteDate";

function getTodayKey() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function typeQuote(el, text, index) {
  if (!el) return;
  if (index > text.length) return;
  el.textContent = text.slice(0, index);
  setTimeout(() => typeQuote(el, text, index + 1), 45);
}

function showQuoteForToday() {
  const el = document.getElementById("quoteText");
  if (!el) return;

  const todayKey = getTodayKey();

  let storedDate = null;
  let storedText = null;
  try {
    storedDate = localStorage.getItem(QUOTE_DATE_KEY);
    storedText = localStorage.getItem(QUOTE_TEXT_KEY);
  } catch {}

  let quote;

  if (storedDate === todayKey && storedText) {
    quote = storedText;
  } else {
    quote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
    try {
      localStorage.setItem(QUOTE_DATE_KEY, todayKey);
      localStorage.setItem(QUOTE_TEXT_KEY, quote);
    } catch {}
  }

  if (el.textContent === quote) return;

  el.textContent = "";
  typeQuote(el, quote, 0);

  const todayLabel = document.getElementById("todayLabel");
  if (todayLabel) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    todayLabel.textContent = d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

document.addEventListener("DOMContentLoaded", showQuoteForToday);
window.addEventListener("pageshow", showQuoteForToday);