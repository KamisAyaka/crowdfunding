import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface CreateProposalModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProposalModal({ projectId, isOpen, onClose }: CreateProposalModalProps) {
  const { address } = useAccount();
  const [proposalAmount, setProposalAmount] = useState("");
  const [proposalDuration, setProposalDuration] = useState("3");
  const [proposalDescription, setProposalDescription] = useState("");
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);

  const { writeContractAsync: createProposalAsync } = useScaffoldWriteContract({ contractName: "ProposalGovernance" });

  // 获取项目信息以验证所有者
  const { data: projectData } = useScaffoldReadContract({
    contractName: "Crowdfunding",
    functionName: "projects",
    args: [BigInt(projectId)],
  });

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposalAmount || !proposalDuration || !proposalDescription) {
      alert("请填写所有字段");
      return;
    }

    if (isNaN(parseFloat(proposalAmount)) || parseFloat(proposalAmount) <= 0) {
      alert("请输入有效的金额");
      return;
    }

    if (isNaN(parseInt(proposalDuration)) || parseInt(proposalDuration) <= 0 || parseInt(proposalDuration) > 7) {
      alert("请输入1-7天的有效期限");
      return;
    }

    // 验证当前用户是否为项目所有者
    if (projectData && address) {
      const projectOwner = (projectData as any)[1]; // creator address is at index 1
      if (address.toLowerCase() !== projectOwner.toLowerCase()) {
        alert("只有项目创建者才能创建提案");
        return;
      }
    } else {
      alert("无法验证项目信息，请确保已连接钱包");
      return;
    }

    try {
      setIsCreatingProposal(true);

      await createProposalAsync({
        functionName: "createProposal",
        args: [
          BigInt(projectId),
          BigInt(parseFloat(proposalAmount) * 1e18), // 将ETH转换为wei
          BigInt(parseInt(proposalDuration)),
          proposalDescription,
        ],
      });

      alert("提案创建成功！");
      // 重置表单
      setProposalAmount("");
      setProposalDuration("3");
      setProposalDescription("");
      onClose();
    } catch (error) {
      console.error("创建提案失败:", error);
      alert("创建提案失败，请查看控制台了解详细信息");
    } finally {
      setIsCreatingProposal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">创建新提案</h3>
        <form onSubmit={handleCreateProposal}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">项目ID</span>
            </label>
            <input type="number" className="input input-bordered" value={projectId} disabled />
            <div className="text-sm text-gray-500 mt-1">项目ID已锁定，只能为此项目创建提案</div>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">请求金额 (ETH)</span>
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="输入请求金额"
              className="input input-bordered"
              value={proposalAmount}
              onChange={e => setProposalAmount(e.target.value)}
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">投票期限 (天)</span>
            </label>
            <select
              className="select select-bordered"
              value={proposalDuration}
              onChange={e => setProposalDuration(e.target.value)}
            >
              <option value="1">1天</option>
              <option value="2">2天</option>
              <option value="3">3天</option>
              <option value="4">4天</option>
              <option value="5">5天</option>
              <option value="6">6天</option>
              <option value="7">7天</option>
            </select>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">提案描述</span>
            </label>
            <textarea
              placeholder="详细描述资金使用计划"
              className="textarea textarea-bordered h-24"
              value={proposalDescription}
              onChange={e => setProposalDescription(e.target.value)}
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose} disabled={isCreatingProposal}>
              取消
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${isCreatingProposal ? "loading" : ""}`}
              disabled={isCreatingProposal}
            >
              {isCreatingProposal ? "创建中..." : "创建提案"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
