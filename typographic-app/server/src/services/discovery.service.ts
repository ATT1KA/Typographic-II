import { z } from 'zod';

const QuerySchema = z.string().min(0);

export type DiscoveryCard = {
  id: string;
  domain: 'Policy' | 'BI' | 'OSINT' | 'SCI' | 'Funding';
  title: string;
  summary: string;
  parameters: Array<{ key: string; value: string | number; confidence?: number }>;
};

export async function performSearch(query: string): Promise<DiscoveryCard[]> {
  const q = QuerySchema.parse(query);
  if (!q) return [];

  return [
    {
      id: 'policy-hr1234',
      domain: 'Policy',
      title: 'HR1234 Clean Energy Act',
      summary: 'Draft bill; committee review in 2 weeks',
      parameters: [
        { key: 'enactmentProbability', value: 0.45, confidence: 0.6 },
        { key: 'sponsor', value: 'Rep. Doe' },
      ],
    },
    {
      id: 'sci-lithium',
      domain: 'SCI',
      title: 'Lithium Supply Chain Risk',
      summary: 'Port disruption risk in Q4',
      parameters: [
        { key: 'shortageRisk', value: 0.2, confidence: 0.55 },
        { key: 'region', value: 'APAC' },
      ],
    },
  ];
}
