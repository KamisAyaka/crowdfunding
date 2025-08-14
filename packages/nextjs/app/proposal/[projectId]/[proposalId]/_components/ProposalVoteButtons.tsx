import { useState } from "react";
import { Proposal } from "../../../types";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type ProposalVoteButtonsProps = {
  proposal: Proposal;
  userVoteAmount: bigint;
  hasVoted: boolean;
  onVoteSuccess: () => void;
};

export function ProposalVoteButtons({ proposal, userVoteAmount, hasVoted, onVoteSuccess }: ProposalVoteButtonsProps) {
  const { address } = useAccount();
  const [isVoting, setIsVoting] = useState(false);

  const { writeContractAsync: voteOnProposal } = useScaffoldWriteContract({ contractName: "ProposalGovernance" });

  const handleVote = async (support: boolean) => {
    try {
      if (!address) {
        notification.error("请先连接钱包");
        return;
      }

      if (userVoteAmount <= 0n) {
        notification.error("您没有为此项目捐款，无法投票");
        return;
      }

      // 检查提案是否已执行
      if (proposal?.executed) {
        notification.error("提案已执行，无法继续投票");
        return;
      }

      setIsVoting(true);

      await voteOnProposal({
        functionName: "voteOnProposal",
        args: [BigInt(proposal.projectId), BigInt(proposal.proposalId), support],
      });

      notification.success(`投票成功！您的票数为 ${(Number(userVoteAmount) / 1e18).toFixed(4)} ETH`);
      onVoteSuccess();
    } catch (err) {
      console.error("投票错误:", err);
      notification.error("投票失败");
    } finally {
      setIsVoting(false);
    }
  };

  if (hasVoted) {
    return <div className="badge badge-success mt-2 py-3 px-4 text-lg font-bold text-white">✅ 您已投票</div>;
  }

  return (
    <div className="mt-2">
      <button
        className="btn btn-error mr-2"
        onClick={() => handleVote(false)}
        disabled={userVoteAmount <= 0n || isVoting}
      >
        {isVoting ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
            投票中...
          </>
        ) : (
          "反对"
        )}
      </button>
      <button className="btn btn-success" onClick={() => handleVote(true)} disabled={userVoteAmount <= 0n || isVoting}>
        {isVoting ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
            投票中...
          </>
        ) : (
          "赞成"
        )}
      </button>
    </div>
  );
}
