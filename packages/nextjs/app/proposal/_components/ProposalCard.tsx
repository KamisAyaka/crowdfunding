import Link from "next/link";
import { Proposal } from "../types";
import { Address } from "~~/components/scaffold-eth";
import { formatEthAmountFixed2 } from "~~/utils/crowdfunding-utils";

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  // 根据提案状态确定显示的徽章
  const getStatusBadge = () => {
    if (!proposal.executed) {
      return <div className="badge badge-primary badge-outline text-white">活跃</div>;
    } else if (proposal.passed) {
      return <div className="badge badge-success badge-outline text-white">已执行</div>;
    } else {
      return <div className="badge badge-error badge-outline text-white">已失败</div>;
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm h-full hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <h2 className="card-title text-lg">{proposal.title}</h2>
          {getStatusBadge()}
        </div>

        <p className="text-sm mt-2 line-clamp-2">{proposal.description}</p>

        <div className="mt-3">
          <div className="flex items-center gap-1 text-sm">
            <span>提案人:</span>
            <Address address={proposal.proposer} size="sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="stat p-2">
            <div className="stat-title text-xs">赞成票</div>
            <div className="stat-value text-sm text-success">{formatEthAmountFixed2(proposal.votesFor)} ETH</div>
          </div>

          <div className="stat p-2">
            <div className="stat-title text-xs">反对票</div>
            <div className="stat-value text-sm text-error">{formatEthAmountFixed2(proposal.votesAgainst)} ETH</div>
          </div>

          <div className="stat p-2">
            <div className="stat-title text-xs">请求金额</div>
            <div className="stat-value text-sm">{formatEthAmountFixed2(proposal.amount)} ETH</div>
          </div>

          <div className="stat p-2">
            <div className="stat-title text-xs">截止日期</div>
            <div className="stat-value text-sm">{proposal.deadline}</div>
          </div>
        </div>

        <div className="card-actions justify-end mt-2">
          <Link href={`/proposal/${proposal.projectId}/${proposal.proposalId}`} className="btn btn-primary btn-sm">
            查看详情
          </Link>
        </div>
      </div>
    </div>
  );
}
