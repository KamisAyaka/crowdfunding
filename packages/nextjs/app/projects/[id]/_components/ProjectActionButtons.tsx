import { useState } from "react";
import Link from "next/link";
import { Project } from "../../types";
import { CreateProposalModal } from "./CreateProposalModal";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface TopDonor {
  address: string;
  totalAmount: number;
  donationCount: number;
}

interface ProjectActionButtonsProps {
  project: Project;
  address: string | undefined;
  topFiveDonors: TopDonor[];
  projectId: number;
}

export function ProjectActionButtons({ project, address, topFiveDonors, projectId }: ProjectActionButtonsProps) {
  const [isEndingProject, setIsEndingProject] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [showCreateProposalForm, setShowCreateProposalForm] = useState(false);

  const { writeContractAsync: endProjectAsync } = useScaffoldWriteContract({ contractName: "Crowdfunding" });
  const { writeContractAsync: withdrawFundsAsync } = useScaffoldWriteContract({ contractName: "Crowdfunding" });
  const { writeContractAsync: refundAsync } = useScaffoldWriteContract({ contractName: "Crowdfunding" });
  const { writeContractAsync, isPending: isDonating } = useScaffoldWriteContract({ contractName: "Crowdfunding" });

  // 检查用户是否有可退款金额
  const { data: donorAmount } = useScaffoldReadContract({
    contractName: "Crowdfunding",
    functionName: "donorAmounts",
    args: [address, BigInt(projectId)],
  });

  // 结束项目函数
  const handleEndProject = async () => {
    if (!address) {
      alert("请先连接钱包");
      return;
    }

    if (!project) {
      alert("项目信息不完整");
      return;
    }

    // 检查是否是项目创建者（成功项目）或任何人都可以结束（失败项目）
    const isCreator = address.toLowerCase() === project.owner?.toLowerCase();
    const isProjectSuccessful = Number(project.raised) >= Number(project.goal);

    if (isProjectSuccessful && !isCreator) {
      alert("只有项目创建者可以结束成功的项目");
      return;
    }

    try {
      setIsEndingProject(true);

      // 准备NFT接收者和金额数据（使用捐赠者排行榜数据）
      const recipients: string[] = topFiveDonors.map(donor => donor.address);
      const amounts: bigint[] = topFiveDonors.map(donor => BigInt(Math.floor(donor.totalAmount)));

      // 调用智能合约结束项目
      await endProjectAsync({
        functionName: "completeProject",
        args: [BigInt(projectId), recipients, amounts],
      });

      alert("项目已成功结束");
    } catch (error) {
      console.error("结束项目失败:", error);
      alert("结束项目失败，请查看控制台了解详细信息");
    } finally {
      setIsEndingProject(false);
    }
  };

  // 提取资金函数
  const handleWithdrawFunds = async () => {
    if (!address) {
      alert("请先连接钱包");
      return;
    }

    if (!project) {
      alert("项目信息不完整");
      return;
    }

    // 检查是否是项目创建者
    const isCreator = address.toLowerCase() === project.owner?.toLowerCase();
    if (!isCreator) {
      alert("只有项目创建者可以提取资金");
      return;
    }

    const withdrawAmount = prompt("请输入要提取的金额 (ETH):");
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      alert("请输入有效的提取金额");
      return;
    }

    try {
      setIsWithdrawing(true);
      // 调用智能合约提取资金
      await withdrawFundsAsync({
        functionName: "withdrawFunds",
        args: [BigInt(projectId), BigInt(parseFloat(withdrawAmount) * 1e18)], // 将ETH转换为wei
      });

      alert(`成功提取 ${withdrawAmount} ETH`);
    } catch (error) {
      console.error("提取资金失败:", error);
      alert("提取资金失败，请查看控制台了解详细信息");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 退款函数
  const handleRefund = async () => {
    if (!address) {
      alert("请先连接钱包");
      return;
    }

    if (!project.completed || project.successful) {
      alert("项目未失败，无法退款");
      return;
    }

    try {
      setIsRefunding(true);
      // 调用智能合约退款
      await refundAsync({
        functionName: "refund",
        args: [BigInt(projectId)],
      });

      alert("退款成功");
    } catch (error) {
      console.error("退款失败:", error);
      alert("退款失败，请查看控制台了解详细信息");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleDonate = async () => {
    if (!address) {
      alert("请先连接钱包");
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      alert("请输入有效的捐赠金额");
      return;
    }

    try {
      // 调用智能合约进行捐赠
      await writeContractAsync({
        functionName: "donate",
        args: [BigInt(projectId)],
        value: BigInt(parseFloat(donationAmount) * 1e18), // 将ETH转换为wei
      });

      // 捐赠成功后清空输入框
      setDonationAmount("");
      alert(`成功捐赠 ${donationAmount} ETH 给项目 ${project?.name || "未知项目"}`);
    } catch (error) {
      console.error("捐赠失败:", error);
      alert("捐赠失败，请查看控制台了解详细信息");
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        {/* 操作按钮区域 */}
        <div className="flex flex-wrap gap-4 mt-4">
          {/* 返回项目列表按钮 */}
          <Link href="/projects" className="btn btn-ghost">
            ← 返回项目列表
          </Link>

          {/* 结束项目按钮 */}
          {!project.completed && (
            <button
              className={`btn btn-warning ${isEndingProject ? "loading" : ""}`}
              onClick={handleEndProject}
              disabled={isEndingProject}
            >
              {isEndingProject ? "结束项目中..." : "结束项目"}
            </button>
          )}

          {/* 项目成功完成后的操作按钮 */}
          {project.completed && project.successful && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateProposalForm(true)}
                disabled={address?.toLowerCase() !== project.owner?.toLowerCase()}
              >
                创建资金使用提案
              </button>

              <button className="btn btn-secondary" onClick={handleWithdrawFunds} disabled={isWithdrawing}>
                {isWithdrawing ? "提取中..." : "提取资金"}
              </button>
            </>
          )}

          {/* 项目失败后的退款按钮 */}
          {project.completed &&
            !project.successful &&
            address &&
            (donorAmount && donorAmount > 0n ? (
              <button className="btn btn-error" onClick={handleRefund} disabled={isRefunding}>
                {isRefunding ? "退款中..." : "申请退款"}
              </button>
            ) : (
              <button className="btn btn-success" disabled>
                已完成退款
              </button>
            ))}
        </div>

        {/* 创建提案模态框 */}
        <CreateProposalModal
          projectId={projectId}
          isOpen={showCreateProposalForm}
          onClose={() => setShowCreateProposalForm(false)}
        />

        {/* 捐赠部分 */}
        {!project.completed && (
          <div className="card bg-base-100 shadow-xl mb-8 mt-6">
            <div className="card-body">
              <h2 className="card-title">支持项目</h2>
              <p className="mb-4">通过捐赠ETH支持这个项目，您将获得相应的NFT奖励。</p>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">捐赠金额 (ETH)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="输入捐赠金额"
                    className="input input-bordered flex-1"
                    value={donationAmount}
                    onChange={e => setDonationAmount(e.target.value)}
                  />
                  <button
                    className={`btn btn-primary ${isDonating ? "loading" : ""}`}
                    onClick={handleDonate}
                    disabled={isDonating}
                  >
                    {isDonating ? "捐赠中..." : "捐赠"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 项目状态提示 */}
        {project.completed && !project.successful && (
          <div className="alert alert-warning shadow-lg mt-8">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>该项目已结束且未达到目标金额。</span>
            </div>
          </div>
        )}

        {project.completed && project.successful && (
          <div className="alert alert-success shadow-lg mt-8">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>该项目已成功完成！</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
