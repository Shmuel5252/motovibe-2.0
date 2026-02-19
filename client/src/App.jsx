function App() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),rgba(15,23,42,0.95)_42%,rgba(2,6,23,1)_78%)] text-white"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-6 pt-5 sm:px-6">
        <header className="flex items-center justify-between">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl leading-none text-slate-200 backdrop-blur-xl"
            aria-label="menu"
          >
            ≡
          </button>
          <span className="text-lg font-semibold tracking-wide text-white/90">
            MotoVibe
          </span>
        </header>

        <main className="mt-10 flex-1">
          <section>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              שלום שמואל
            </h1>
            <p className="mt-2 text-lg text-slate-300">מוכן לרכיבה</p>
            <button
              type="button"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-5 py-3 text-base font-semibold text-white shadow-[0_0_30px_rgba(20,184,166,0.35)] ring-1 ring-emerald-300/40 transition hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              התחל רכיבה
            </button>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">מסלולים אחרונים</h2>
                <button
                  type="button"
                  className="text-xs text-emerald-300 hover:text-emerald-200"
                >
                  ראה הכל
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">האופנוע שלי</h2>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
                  תקין
                </span>
              </div>
            </article>
          </section>
        </main>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 text-sm text-slate-200">
            <span>4 רכיבות</span>
            <span className="text-white/30">|</span>
            <span>3:15 שעות</span>
            <span className="text-white/30">|</span>
            <span>215 ק״מ</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
