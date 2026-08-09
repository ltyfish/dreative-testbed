// Product content. Values marked PRESERVED are product requirements, not design
// opinions: names, descriptions, metric values, prices, units, FAQ text.

export const FEATURES = [
  { id: 'ingest', name: 'Warehouse-native ingest', body: 'Point Cadence at Snowflake, BigQuery, or Postgres. No pipeline to maintain, no data leaves your warehouse.' },
  { id: 'metrics', name: 'Governed metric layer', body: 'Define revenue once. Every chart, alert, and export uses the same definition, with a visible change history.' },
  { id: 'alerts', name: 'Anomaly alerts', body: 'Cadence learns each metric’s normal shape and pages the owning team when it breaks, not when it merely moves.' },
  { id: 'embed', name: 'Embedded dashboards', body: 'Ship customer-facing analytics inside your own product with row-level permissions inherited from your app.' },
  { id: 'sql', name: 'SQL escape hatch', body: 'Every visual is a query you can open, edit, and version. Nothing is locked behind the interface.' },
  { id: 'audit', name: 'Audit and compliance', body: 'SOC 2 Type II, full query audit log, and per-column access policies enforced at the warehouse.' },
]

export const METRICS = [
  { label: 'Median query time', value: '340ms', note: 'across 2.1B row tables' },
  { label: 'Time to first dashboard', value: '11 min', note: 'median for new workspaces' },
  { label: 'Metric definitions governed', value: '18,400', note: 'across all customers' },
  { label: 'Uptime, trailing 12 months', value: '99.98%', note: 'measured externally' },
]

export const PLANS = [
  { id: 'team', name: 'Team', price: '$0', unit: 'up to 5 editors', cta: 'Start free', features: ['3 warehouse connections', '20 governed metrics', 'Email alerts', 'Community support'] },
  { id: 'growth', name: 'Growth', price: '$490', unit: 'per month', cta: 'Start 14-day trial', features: ['Unlimited connections', 'Unlimited metrics', 'Slack and PagerDuty alerts', 'Embedded dashboards', 'SSO and SCIM'], featured: true },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', unit: 'annual contract', cta: 'Talk to sales', features: ['Everything in Growth', 'Private deployment', 'Custom SLA and audit exports', 'Named support engineer'] },
]

export const CUSTOMERS = ['Northwind', 'Halcyon', 'Perigee', 'Tessellate', 'Brightmoor', 'Ostrom Labs']

export const FAQ = [
  { q: 'Does our data leave the warehouse?', a: 'No. Cadence pushes queries down to your warehouse and only caches aggregate results you explicitly mark cacheable.' },
  { q: 'How is this different from a BI tool?', a: 'BI tools let anyone define a metric anywhere, which is how a company ends up with nine definitions of revenue. Cadence makes the definition the governed object and the chart the disposable one.' },
  { q: 'Can we migrate our existing dashboards?', a: 'Growth and Enterprise include an importer for Looker and Metabase. It converts saved queries; hand-tuned visualisations need review.' },
  { q: 'What happens when the trial ends?', a: 'The workspace drops to the free Team plan. Nothing is deleted, and dashboards over the limit become read-only until you upgrade.' },
]

// The nine conflicting definitions from the FAQ ("nine definitions of revenue"),
// as they would exist scattered across a company before Cadence.
export const SCATTERED = [
  { tool: 'Looker', owner: 'Growth', figure: '$8.42M' },
  { tool: 'Metabase', owner: 'Support', figure: '$8.40M' },
  { tool: 'Sheets', owner: 'Finance', figure: '$7.63M' },
  { tool: 'Sheets', owner: 'Board deck', figure: '$7.91M' },
  { tool: 'Notebook', owner: 'Data sci.', figure: '$8.11M' },
  { tool: 'dbt model', owner: 'Platform', figure: '$7.88M' },
  { tool: 'Salesforce', owner: 'Sales ops', figure: '$8.60M' },
  { tool: 'Stripe', owner: 'Billing', figure: '$8.44M' },
  { tool: 'Warehouse', owner: 'Analytics', figure: '$7.63M' },
]

// The governed object itself. Selecting a revision is the one shared state that
// propagates through the peak section: SQL body, downstream consumers, the
// monthly shape, and the revision stamp carried in the header rail.
export const REVISIONS = [
  {
    id: 'v1',
    stamp: 'v1',
    date: '2024-11-04',
    author: 'p.raman',
    reason: 'Imported from Looker “Revenue (main)”',
    sql: [
      'SELECT date_trunc(\'month\', o.created_at) AS month,',
      '       sum(o.total_amount)               AS revenue',
      'FROM   analytics.orders o',
      'GROUP  BY 1',
    ],
    caveat: 'Counts refunds and internal test orders as revenue.',
    quarter: '$8.42M',
    alert: '−8% vs. 28-day median',
    grain: 'order date',
    exportRows: '1,204,880',
    shape: [52, 55, 61, 58, 66, 71, 69, 78, 74, 83, 88, 96],
  },
  {
    id: 'v2',
    stamp: 'v2',
    date: '2025-03-18',
    author: 'd.okonkwo',
    reason: 'Exclude refunds and test accounts',
    sql: [
      'SELECT date_trunc(\'month\', o.created_at) AS month,',
      '       sum(o.total_amount)               AS revenue',
      'FROM   analytics.orders o',
      'WHERE  o.status <> \'refunded\'',
      '  AND  NOT o.is_test_account',
      'GROUP  BY 1',
    ],
    caveat: 'Recognises revenue when the order is placed, not shipped.',
    quarter: '$7.91M',
    alert: '−6% vs. 28-day median',
    grain: 'order date',
    exportRows: '1,131,402',
    shape: [48, 50, 57, 52, 60, 64, 63, 70, 67, 75, 79, 86],
  },
  {
    id: 'v3',
    stamp: 'v3',
    date: '2026-01-22',
    author: 'p.raman',
    reason: 'Recognise on ship date to match the ledger',
    sql: [
      'SELECT date_trunc(\'month\', o.shipped_at) AS month,',
      '       sum(o.total_amount)               AS revenue',
      'FROM   analytics.orders o',
      'WHERE  o.status <> \'refunded\'',
      '  AND  NOT o.is_test_account',
      '  AND  o.shipped_at IS NOT NULL',
      'GROUP  BY 1',
    ],
    caveat: 'Matches the finance ledger. Current governed definition.',
    quarter: '$7.63M',
    alert: '−6% vs. 28-day median',
    grain: 'ship date',
    exportRows: '1,098,657',
    shape: [45, 49, 53, 55, 57, 61, 66, 65, 72, 74, 81, 84],
  },
]

export const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
