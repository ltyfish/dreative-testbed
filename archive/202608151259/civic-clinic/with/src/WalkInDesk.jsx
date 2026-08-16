import { CLINIC, HOURS, formatDuration, formatTime } from './clinic.js'

function Answer({ status }) {
  const { state } = status

  if (state === 'open') {
    return (
      <>
        <p className="desk-answer" data-answer="yes">
          Yes.
          <span> You can walk in right now.</span>
        </p>
        <p className="desk-detail">
          Walk-in registration closes in{' '}
          <strong className="num">{formatDuration(status.minutesLeft)}</strong>, at{' '}
          <strong className="num">{formatTime(status.registrationCloses)}</strong>. The last patient
          today is accepted at <span className="num">{formatTime(status.registrationCloses)}</span>.
        </p>
      </>
    )
  }

  if (state === 'last-call') {
    return (
      <>
        <p className="desk-answer" data-answer="late">
          Registration has closed.
          <span> The doors are open for another {formatDuration(status.minutesLeft)}.</span>
        </p>
        <p className="desk-detail">
          If you arrive now and it is urgent, come in anyway and speak to the front desk. Otherwise
          we reopen {status.next ? status.next.when : 'soon'}
          {status.next ? (
            <>
              {' '}
              at <strong className="num">{status.next.time}</strong>
            </>
          ) : null}
          .
        </p>
      </>
    )
  }

  if (state === 'before-open') {
    return (
      <>
        <p className="desk-answer" data-answer="soon">
          Not yet.
          <span>
            {' '}
            We open today at {status.today.open}
            {status.next ? `, in ${formatDuration(status.next.minutesUntil)}` : ''}.
          </span>
        </p>
        <p className="desk-detail">
          Walk-ins are accepted from <strong className="num">{status.today.open}</strong> until{' '}
          <strong className="num">{formatTime(status.registrationCloses)}</strong> today. No
          appointment needed.
        </p>
      </>
    )
  }

  return (
    <>
      <p className="desk-answer" data-answer="no">
        {status.state === 'closed-today' ? 'Closed today.' : 'Closed for today.'}
        {status.next ? (
          <span>
            {' '}
            We open {status.next.when} at {status.next.time}.
          </span>
        ) : null}
      </p>
      <p className="desk-detail">
        {status.next ? (
          <>
            That is in{' '}
            <strong className="num">{formatDuration(status.next.minutesUntil)}</strong>. Walk-ins are
            always welcome — no appointment and no insurance needed.
          </>
        ) : (
          <>Walk-ins are always welcome — no appointment and no insurance needed.</>
        )}
      </p>
    </>
  )
}

function WindowBar({ status }) {
  if (!status.window || status.state === 'closed-today') return null
  const pct = Math.round((status.progress ?? 0) * 100)

  return (
    <div className="window" aria-hidden="true">
      <div className="window-track">
        <div className="window-fill" style={{ '--pct': `${pct}%` }} />
        {status.state === 'open' ? <span className="window-now" style={{ '--pct': `${pct}%` }} /> : null}
      </div>
      <div className="window-scale">
        <span className="num">{status.today.open}</span>
        <span className="window-label">walk-in window</span>
        <span className="num">{formatTime(status.registrationCloses)}</span>
      </div>
    </div>
  )
}

export default function WalkInDesk({ status }) {
  return (
    <div className="desk" id="walkin-status" data-tone={status.tone} data-state={status.state}>
      <div className="desk-flag">
        <span className="desk-dot" />
        <span className="desk-flag-text">
          {status.canWalkIn ? 'Open for walk-ins' : status.state === 'last-call' ? 'Open, registration closed' : 'Closed'}
        </span>
        <span className="desk-now num">
          {status.dayLabel} {status.nowLabel}
        </span>
      </div>

      <div className="desk-body">
        <div className="desk-main">
          <p className="desk-question">Can I be seen today?</p>
          <Answer status={status} />
          <WindowBar status={status} />
          <div className="desk-actions">
            <a className="btn btn-primary" href={CLINIC.phoneHref}>
              Call {CLINIC.phone}
            </a>
            <a className="btn btn-secondary" href="#visit">
              Getting here
            </a>
          </div>
        </div>

        <div className="desk-week">
          <h2 className="desk-week-title" id="hours">
            Opening hours
          </h2>
          <table className="hours-table">
            <caption className="sr-only">Opening hours for every day of the week</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Open</th>
                <th scope="col">Close</th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h, i) => (
                <tr
                  key={h.day}
                  data-day={h.day.toLowerCase()}
                  data-today={i === status.todayIndex ? 'true' : undefined}
                  aria-current={i === status.todayIndex ? 'date' : undefined}
                >
                  <th scope="row">
                    {h.day}
                    {i === status.todayIndex ? <span className="today-tag">today</span> : null}
                  </th>
                  {h.open ? (
                    <>
                      <td className="num">{h.open}</td>
                      <td className="num">{h.close}</td>
                    </>
                  ) : (
                    <td colSpan={2} className="is-closed">
                      Closed
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">
            Walk-in registration closes 30 minutes before we do. If you arrive late and it is
            urgent, come in anyway and speak to the front desk.
          </p>
        </div>
      </div>
    </div>
  )
}
