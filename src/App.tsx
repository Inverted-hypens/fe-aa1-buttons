import { useCallback, useRef, useState } from 'react'
import StatefulButton, { type ButtonStatus } from './StatefulButton'
import './App.css'

type Outcome = 'random' | 'success' | 'error'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const MOTION_NOTES = [
  {
    what: 'Hover lift + shadow',
    how: '150ms, ease-out',
    why: 'A reaction to the pointer should start fast and settle gently.',
  },
  {
    what: 'Press',
    how: '80ms, ease-out',
    why: 'Under ~100ms reads as instant, so the button feels physically pressed.',
  },
  {
    what: 'Focus ring',
    how: '120ms, linear',
    why: 'Quick fade only. It must never lag behind Tab.',
  },
  {
    what: 'Label / spinner / result swap',
    how: '250ms, ease-in-out (incoming delayed 60ms)',
    why: "A-to-B swaps need a symmetric curve. The delay lets the old label leave before the new one arrives, so they don't overlap.",
  },
  {
    what: 'Success check',
    how: '250ms, overshoot curve',
    why: 'A small pop makes the good outcome feel rewarding without being loud.',
  },
  {
    what: 'Error shake',
    how: '320ms, once',
    why: 'Long enough to notice, short enough not to nag. Colour, icon and label carry the message after it stops.',
  },
]

export default function App() {
  const [status, setStatus] = useState<ButtonStatus>('idle')
  const [disabled, setDisabled] = useState(false)
  const nextOutcome = useRef<Outcome>('random')
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Fake async call: random 0.7-1.8s delay, 20% failure unless forced.
  const action = useCallback(async () => {
    const outcome = nextOutcome.current
    nextOutcome.current = 'random'
    await sleep(700 + Math.random() * 1100)
    const fails =
      outcome === 'error' || (outcome === 'random' && Math.random() < 0.2)
    if (fails) throw new Error('Simulated failure')
  }, [])

  const force = (outcome: Exclude<Outcome, 'random'>) => {
    nextOutcome.current = outcome
    buttonRef.current?.click()
  }

  const busy = status === 'loading' || status === 'success'

  return (
    <main className="lab">
      <header>
        <h1>Button Lab</h1>
        <p>
          One button, five states: idle, hover/focus, loading, success, error
          (plus disabled). Click it for a random result (20% fail), or force an
          outcome below.
        </p>
      </header>

      <section className="lab__demo" aria-label="Demo">
        <StatefulButton
          ref={buttonRef}
          action={action}
          disabled={disabled}
          onStatusChange={setStatus}
        />
        <p data-testid="status">
          State:{' '}
          <span className="lab__mono">{disabled ? 'disabled' : status}</span>
        </p>

        <div className="lab__controls">
          <button
            type="button"
            onClick={() => force('success')}
            disabled={disabled || busy}
          >
            Force success
          </button>
          <button
            type="button"
            onClick={() => force('error')}
            disabled={disabled || busy}
          >
            Force error
          </button>
          <label>
            <input
              type="checkbox"
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
            />
            Disabled
          </label>
        </div>
      </section>

      <section>
        <h2>Duration &amp; easing choices</h2>
        <p style={{ marginBottom: '1rem' }}>
          Only transform and opacity animate. Colour changes are crossfades
          between stacked layers, and every label lives in one grid cell so the
          button never changes size. With reduced motion on, the slides, lift,
          press, pop and shake are removed; colour, icon and label changes stay,
          and the spinner becomes a soft pulse.
        </p>
        <ul className="lab__notes">
          {MOTION_NOTES.map((n) => (
            <li key={n.what}>
              <span style={{ fontWeight: 500 }}>{n.what}</span>{' '}
              <span className="lab__mono" style={{ color: 'var(--muted-foreground)' }}>
                ({n.how})
              </span>
              <br />
              <span>{n.why}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
