import { REVIEWS } from '../data.js'

export default function Reviews() {
  return (
    <section className="section reviews" id="reviews">
      <div className="reviews-head">
        <p className="section-eyebrow">What subscribers say</p>
        <h2 className="section-title">Three people who buy this coffee every month.</h2>
      </div>

      <div className="reviews-list">
        {REVIEWS.map((r, i) => (
          <blockquote className="review" key={r.name} data-review={i + 1}>
            <p className="review-quote">{r.quote}</p>
            <footer className="review-foot">
              <strong>{r.name}</strong>
              <span>{r.role}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
