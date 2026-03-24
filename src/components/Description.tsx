export default function Description() {
  const features = [
    {
      icon: '$',
      title: 'Smart Budgeting',
      description:
        'Build monthly plans around your income, obligations, and goals instead of guessing category limits.',
      accent: 'from-teal-500/15 to-emerald-500/5',
    },
    {
      icon: '01',
      title: 'Deep Insights',
      description:
        'Spot spending patterns, pressure points, and extra margin with analysis that stays readable.',
      accent: 'from-amber-400/20 to-orange-400/5',
    },
    {
      icon: 'AI',
      title: 'Goal Setting',
      description:
        'Turn vague savings plans into timelines, progress checkpoints, and realistic next actions.',
      accent: 'from-sky-500/15 to-cyan-400/5',
    },
  ];

  return (
    <section id="why-budget-ai" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-3xl">
          <span className="section-label text-teal-800">Why BudgetAI</span>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Financial planning that feels calm, clear, and genuinely useful.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            BudgetAI helps you organize income, recurring costs, savings targets, and day-to-day
            spending in one flow. The product is designed to feel confident and editorial rather
            than generic fintech boilerplate.
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
