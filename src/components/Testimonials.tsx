export default function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Small Business Owner',
      content:
        'BudgetAI transformed the way I manage my finances. I was able to cut expenses by 20% in the first month!',
      avatar: '👩‍💼',
    },
    {
      name: 'Michael Chen',
      role: 'Student',
      content:
        'Finally, a budgeting app that actually makes sense. The insights helped me save for my dream laptop.',
      avatar: '👨‍🎓',
    },
    {
      name: 'Emma Williams',
      role: 'Freelancer',
      content:
        'Tracking irregular income is now effortless. BudgetAI gives me peace of mind with accurate forecasting.',
      avatar: '👩‍💻',
    },
    {
      name: 'David Martinez',
      role: 'Financial Analyst',
      content:
        'Impressed by the sophistication of the analytics. It rivals tools I used to pay hundreds for.',
      avatar: '👨‍💼',
    },
  ];

  return (
    <section id="testimonials" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="section-label text-amber-700">Trusted By Real People</span>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Proof that clarity matters.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-slate-700">
            Early users mostly respond to the same thing: less guesswork, fewer blind spots, and a dashboard that feels easier to act on.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="surface-card rounded-[2rem] p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-3xl">
                    {testimonial.avatar}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-950">{testimonial.name}</h3>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                  5.0
                </div>
              </div>

              <div className="mb-4 flex text-base text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              <p className="text-lg leading-8 text-slate-700">
                &ldquo;{testimonial.content}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
