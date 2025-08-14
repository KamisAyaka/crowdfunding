import { useState } from "react";
import { Proposal } from "../../../types";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type ProposalExecuteButtonProps = {
  proposal: Proposal;
  onExecuteSuccess: () => void;
};

export function ProposalExecuteButton({ proposal, onExecuteSuccess }: ProposalExecuteButtonProps) {
  const { address } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);

  const { writeContractAsync: executeProposal } = useScaffoldWriteContract({ contractName: "ProposalGovernance" });

  const handleExecuteProposal = async () => {
    try {
      if (!address) {
        notification.error("请先连接钱包");
        return;
      }

      setIsExecuting(true);

      await executeProposal({
        functionName: "executeProposal",
        args: [BigInt(proposal.projectId), BigInt(proposal.proposalId)],
      });

      notification.success("提案执行成功！");
      onExecuteSuccess();
    } catch (err) {
      console.error("执行提案错误:", err);
      notification.error("执行提案失败");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="mt-4 text-right">
      <button className="btn btn-primary" onClick={handleExecuteProposal} disabled={isExecuting}>
        {isExecuting ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
            执行中...
          </>
        ) : (
          "执行提案"
        )}
      </button>
    </div>
  );
}
