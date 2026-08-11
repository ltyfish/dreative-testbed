import { useState } from 'react'

export default function Contact() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
    setEmail('')
    setMessage('')
  }

  return (
    <section className="section contact" id="contact">
      <div className="contact-side">
        <p className="section-eyebrow">Get in touch</p>
        <h2 className="section-title">Two roasters read this.</h2>
        <p className="contact-note">
          Wholesale, a question about a lot, or an argument about bloom times — it all arrives in
          the same inbox, next to the machine.
        </p>
        <p className="contact-place">
          Northwind Coffee Roasters
          <br />
          Bergen, Norway
        </p>
      </div>

      <div className="contact-card">
        {sent ? (
          <p className="form-success" role="status">
            <span className="form-success-stamp" aria-hidden="true">
              Received
            </span>
            Thanks — we read everything and reply within a day.
          </p>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Questions, wholesale, or just coffee talk"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Send message
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
