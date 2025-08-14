import { type Proposal } from "../../../types";

type ProposalStatusBadgeProps = {
  proposal: Proposal;
};
export function ProposalStatusBadge({ proposal }: ProposalStatusBadgeProps) {
  if (proposal.executed) {
    return (
      <div
        className={`badge ${proposal.passed ? "badge-success" : "badge-error"} gap-2 py-4 px-6 text-xl font-bold text-white`}
      >
        {proposal.passed ? "✅ 提案已通过" : "❌ 提案未通过"}
      </div>
    );
  } else {
    return <div className="badge badge-info gap-2 py-4 px-6 text-xl font-bold text-white">⏳ 投票进行中</div>;
  }
}
