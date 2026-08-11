import probat from '../media/probat.jpg'

const FIGURES = [
  { value: '11', unit: 'farms', line: 'Direct relationships across Ethiopia, Colombia, Kenya, Guatemala and Sumatra.' },
  { value: '2.4×', unit: 'commodity price paid', line: 'The average we pay above the C price. Every contract is published.' },
  { value: '12kg', unit: 'max batch size', line: 'One drum, two roasters, no batch larger than the machine was built for.' },
  { value: '<24h', unit: 'roast to shipment', line: 'The gap between the beans leaving the drum and the bag leaving Bergen.' },
]

export default function Ledger() {
  return (
    <section className="section ledger" id="story">
      <div className="ledger-figure">
        <img
          src={probat}
          alt="The brass and cast-iron front of a Probat drum roaster, lit by daylight"
          loading="lazy"
        />
        <p className="ledger-caption">
          One machine. A 1962 Probat, still the only roaster in the building.
        </p>
      </div>

      <div className="ledger-body">
        <p className="section-eyebrow">Our story</p>
        <h2 className="section-title">
          Ten years later we are still small <em>on purpose</em>.
        </h2>
        <p className="ledger-lede">
          Northwind started in 2014 as a roastery in a fishing shed. Ten years later we are still
          small on purpose: two roasters, one machine, and direct relationships with eleven farms
          across Ethiopia, Colombia, Kenya, Guatemala, and Sumatra. We pay on average 2.4× the
          commodity price and publish every contract.
        </p>

        <dl className="ledger-table">
          {FIGURES.map((f) => (
            <div className="ledger-row" key={f.unit}>
              <dt>
                <span className="ledger-value">{f.value}</span>
                <span className="ledger-unit">{f.unit}</span>
              </dt>
              <dd>{f.line}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
