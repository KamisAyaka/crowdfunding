"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Proposal } from "../../types";
import { ProposalExecuteButton } from "./_components/ProposalExecuteButton";
import { ProposalStatusBadge } from "./_components/ProposalStatusBadge";
import { ProposalVoteButtons } from "./_components/ProposalVoteButtons";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { calculateProposalStatus, calculateProposalVotes, formatTimestampToDate } from "~~/utils/crowdfunding-utils";

export default function ProposalDetailPage({ params }: { params: Promise<{ projectId: string; proposalId: string }> }) {
  const router = useRouter();
  const { address } = useAccount();
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteAmount, setUserVoteAmount] = useState(0n);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // 使用 React.use() 解包 params Promise
  const unwrappedParams = use(params);
  const projectId = parseInt(unwrappedParams.projectId);
  const proposalId = parseInt(unwrappedParams.proposalId);

  // 获取提案创建事件
  const { data: proposalEvents, isLoading: isEventsLoading } = useScaffoldEventHistory({
    contractName: "ProposalGovernance",
    eventName: "ProposalCreated",
    fromBlock: 8980233n,
    filters: { projectId: BigInt(projectId), proposalId: BigInt(proposalId) },
    watch: true,
    transactionData: true,
  });

  // 监听投票事件
  const { data: voteEvents } = useScaffoldEventHistory({
    contractName: "ProposalGovernance",
    eventName: "Voted",
    fromBlock: 8980233n,
    watch: true,
  });

  // 监听提案执行事件
  const { data: executedEvents } = useScaffoldEventHistory({
    contractName: "ProposalGovernance",
    eventName: "ProposalExecuted",
    fromBlock: 8980233n,
    watch: true,
  });

  // 获取用户投票金额
  const { data: userDonationAmount } = useScaffoldReadContract({
    contractName: "Crowdfunding",
    functionName: "donorAmounts",
    args: [address, BigInt(projectId)],
  });

  // 处理提案数据
  const proposal: Proposal | null =
    proposalEvents && proposalEvents.length > 0
      ? (() => {
          // 数据处理完成后设置isLoading为false
          if (isLoading) {
            setIsLoading(false);
          }

          const event = proposalEvents[0];
          const projectId = Number(event.args.projectId);
          const proposalId = Number(event.args.proposalId);
          const deadlineTimestamp = Number(event.args.voteDeadline);

          // 查找该提案的投票事件
          const proposalVotes =
            voteEvents?.filter(
              vote => Number(vote.args.projectId) === projectId && Number(vote.args.proposalId) === proposalId,
            ) || [];

          // 使用通用函数计算赞成票和反对票
          const { votesFor, votesAgainst } = calculateProposalVotes(proposalVotes);

          // 查找执行状态
          const executedEvent = executedEvents?.find(
            exec => Number(exec.args.projectId) === projectId && Number(exec.args.proposalId) === proposalId,
          );

          // 使用通用函数计算执行状态
          const { isExecuted, isPassed } = calculateProposalStatus(executedEvent);

          // 返回提案数据时不直接更新状态，在useEffect中统一处理
          return {
            projectId,
            proposalId,
            title: `项目 #${projectId} 的提案`,
            description: event.args.description || "",
            proposer: (event as any).transactionData?.from || "0x0000000000000000000000000000000000000000",
            votesFor,
            votesAgainst,
            deadline: formatTimestampToDate(deadlineTimestamp),
            deadlineTimestamp, // 保存原始时间戳
            amount: Number(event.args.amount),
            executed: isExecuted,
            passed: isPassed,
          };
        })()
      : null;

  // 如果没有提案事件数据且加载已完成，设置isLoading为false
  useEffect(() => {
    if (!proposalEvents && !isEventsLoading) {
      setIsLoading(false);
    }
  }, [proposalEvents, isEventsLoading]);

  // 检查用户是否已投票
  useEffect(() => {
    const checkIfVoted = async () => {
      if (!address || !voteEvents || !proposal) return;

      // 检查用户是否已经投票
      const userVote = voteEvents.find(
        vote =>
          Number(vote.args.projectId) === proposal.projectId &&
          Number(vote.args.proposalId) === proposal.proposalId &&
          vote.args.voter === address,
      );

      setHasVoted(!!userVote);

      // 获取用户投票金额
      if (userDonationAmount) {
        setUserVoteAmount(userDonationAmount);
      }
    };

    checkIfVoted();
  }, [voteEvents, address, proposal, userDonationAmount]);

  // 移除了检查截止日期的useEffect，因为我们不再需要在前端检查时间限制

  // 处理投票和执行后的数据刷新
  useEffect(() => {
    if (!shouldRefresh) return;

    // 检查用户投票状态
    if (proposal && address && voteEvents) {
      const userVote = voteEvents.find(
        vote =>
          Number(vote.args.projectId) === proposal.projectId &&
          Number(vote.args.proposalId) === proposal.proposalId &&
          vote.args.voter === address,
      );

      setHasVoted(!!userVote);
    }

    // 重置刷新标志
    if (shouldRefresh) {
      setShouldRefresh(false);
    }
  }, [voteEvents, address, userDonationAmount, isEventsLoading, projectId, proposalId, proposal, shouldRefresh]);

  const handleVoteSuccess = () => {
    // 投票成功后更新状态
    setHasVoted(true);
    // 触发数据刷新
    setShouldRefresh(true);
  };

  const handleExecuteSuccess = () => {
    // 执行成功后触发数据刷新
    setShouldRefresh(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-96">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">未找到提案</h2>
          <button className="btn btn-primary" onClick={() => router.back()}>
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">提案详情</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()}>
          返回
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl">{proposal.title}</h2>
          <p className="text-xl">{proposal.description}</p>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-bold text-xl">提案人:</span>
              <Address address={proposal.proposer} size="sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="stat">
              <div className="stat-title text-lg">赞成票</div>
              <div className="stat-value text-success text-2xl">{(proposal.votesFor / 1e18).toFixed(4)} ETH</div>
            </div>

            <div className="stat">
              <div className="stat-title text-lg">反对票</div>
              <div className="stat-value text-error text-2xl">{(proposal.votesAgainst / 1e18).toFixed(4)} ETH</div>
            </div>

            <div className="stat">
              <div className="stat-title text-lg">请求金额</div>
              <div className="stat-value text-2xl">{(proposal.amount / 1e18).toFixed(2)} ETH</div>
            </div>

            <div className="stat">
              <div className="stat-title text-lg">截止日期</div>
              <div className="stat-value text-2xl">{proposal.deadline}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold mb-2">投票状态</h3>
                <ProposalStatusBadge proposal={proposal} />
              </div>

              {!proposal.executed && address && (
                <div className="text-right">
                  <p className="text-lg">您的投票权: {(Number(userVoteAmount) / 1e18).toFixed(4)} ETH</p>
                  <ProposalVoteButtons
                    proposal={proposal}
                    userVoteAmount={userVoteAmount}
                    hasVoted={hasVoted}
                    onVoteSuccess={handleVoteSuccess}
                  />
                </div>
              )}
            </div>

            {/* 执行提案按钮 - 始终显示，让区块链处理时间限制 */}
            {!proposal.executed && address && (
              <div className="mt-4 text-right">
                <ProposalExecuteButton proposal={proposal} onExecuteSuccess={handleExecuteSuccess} />
              </div>
            )}
          </div>
        </div>
      </div>

      {!address && (
        <div className="alert alert-warning mt-6">
          <span className="text-xl">请连接钱包以查看您的投票权和进行投票</span>
        </div>
      )}

      {address && userVoteAmount <= 0n && (
        <div className="alert alert-info mt-6">
          <span className="text-xl">您没有为此项目捐款，因此无法参与投票</span>
        </div>
      )}
    </div>
  );
}
