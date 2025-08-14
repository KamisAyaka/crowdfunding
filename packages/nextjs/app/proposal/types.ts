export interface Proposal {
  projectId: number;
  proposalId: number;
  title: string;
  description: string;
  proposer: string;
  votesFor: number;
  votesAgainst: number;
  deadline: string;
  deadlineTimestamp?: number;
  amount: number;
  executed: boolean;
  passed: boolean;
}
