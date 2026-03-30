export default function Description() {
  const features = [
    {
      icon: '$',
      title: 'Real Monthly Planning',
      description:
        'Build a budget around live transactions, monthly caps, rent, utilities, and the goals you actually care about.',
      accent: 'from-teal-500/15 to-emerald-500/5',
    },
    {
      icon: '01',
      title: 'Clearer Tradeoffs',
      description:
        'See overspending quickly, understand what is driving it, and make sharper decisions without reading a spreadsheet.',
      accent: 'from-amber-400/20 to-orange-400/5',
    },
    {
      icon: 'AI',
      title: 'Guided Deep Dives',
      description:
        'Open focused AI guidance when you want help cutting spend, protecting cashflow, or reaching a savings goal.',
      accent: 'from-sky-500/15 to-cyan-400/5',
    },
  ];

  return (
    <section id="why-budget-ai" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-3xl">
          <span className="section-label text-teal-800">Why BudgetAI</span>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            A simpler way to understand your financial picture.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            BudgetAI keeps the homepage promise simple: connect real data, set practical targets,
            and make better monthly decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`surface-card group rounded-[2rem] bg-gradient-to-br ${feature.accent} p-8`}
            >
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-lg shadow-slate-950/15">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-2xl font-semibold text-slate-950">{feature.title}</h3>
              <p className="leading-7 text-slate-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
