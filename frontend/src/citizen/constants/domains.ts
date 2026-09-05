/**
 * BUGFIX (#7): "Fix domain list — use ONE domain list everywhere."
 *
 * This list must always mirror `ALLOWED_DOMAINS` in
 * ai-pipeline/ai-pipeline/main.py exactly. Before this fix, the citizen
 * review screen showed an entirely different, informal list
 * ("Water and Drainage", "Public Health", "Transport", "Electricity"...)
 * that didn't exist anywhere in the backend's taxonomy. Selecting one
 * of those values got silently rejected by the AI pipeline's
 * validation step (or, before that validation existed, saved a domain
 * value that could never match any dashboard/domain filter) — which is
 * exactly why a manually chosen domain looked like it "wasn't saving".
 *
 * If you ever need to add/remove a domain, update BOTH this file and
 * the `DOMAINS` constant in ai-pipeline/ai-pipeline/main.py.
 */
export const DOMAIN_OPTIONS = [
  'Road Infrastructure',
  'Water Supply',
  'Water Quality',
  'Waste Management',
  'Public Lighting',
  'Drainage and Flooding',
  'Public Transport',
  'Traffic Management',
  'Public Safety',
  'Environment',
  'Pollution',
  'Healthcare',
  'Education',
  'Agriculture',
  'Energy',
  'Public Facilities',
  'Housing',
  'Sanitation',
  'Disaster Management',
  'Communication',
  'Other',
] as const;

export const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'] as const;
