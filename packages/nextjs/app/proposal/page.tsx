"use client";

import { useState } from "react";
import { ProposalCard } from "./_components/ProposalCard";
import { Proposal } from "./types";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { calculateProposalStatus, calculateProposalVotes, formatTimestampToDate } from "~~/utils/crowdfunding-utils";

export { type Proposal } from "./types";

export default function ProposalPage() {
  const [activeTab, setActiveTab] = useState<"active" | "executed" | "cancelled">("active");

  // 监听提案创建事件
  const {
    data: proposalEvents,
    isLoading,
    error,
  } = useScaffoldEventHistory({
    contractName: "ProposalGovernance",
    eventName: "ProposalCreated",
    fromBlock: 8980233n,
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

  // 处理提案数据
  const proposals =
    proposalEvents?.reduce((uniqueProposals: Proposal[], event) => {
      const projectId = Number(event.args.projectId);
      const proposalId = Number(event.args.proposalId);

      // 检查是否已处理过该提案
      const existingProposal = uniqueProposals.find(p => p.projectId === projectId && p.proposalId === proposalId);

      // 如果提案已存在，跳过以避免重复
      if (existingProposal) {
        return uniqueProposals;
      }

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

      const newProposal: Proposal = {
        projectId,
        proposalId,
        title: `项目 #${projectId} 的提案`,
        description: event.args.description || "",
        proposer: (event as any).transactionData?.from || "0x0000000000000000000000000000000000000000",
        votesFor,
        votesAgainst,
        deadline: formatTimestampToDate(Number(event.args.voteDeadline)),
        amount: Number(event.args.amount),
        executed: isExecuted,
        passed: isPassed,
      };

      return [...uniqueProposals, newProposal];
    }, []) || [];

  // 使用单次遍历处理所有提案状态
  const { activeProposals, executedProposals, cancelledProposals } = proposals.reduce(
    (acc, proposal) => {
      if (!proposal.executed) {
        acc.activeProposals.push(proposal);
      } else if (proposal.passed) {
        acc.executedProposals.push(proposal);
      } else {
        acc.cancelledProposals.push(proposal);
      }
      return acc;
    },
    {
      activeProposals: [] as Proposal[],
      executedProposals: [] as Proposal[],
      cancelledProposals: [] as Proposal[],
    },
  );

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">社区提案</h1>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {renderHeader()}
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">正在加载提案数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        {renderHeader()}
        <div className="alert alert-error">
          <span>加载提案数据时出错: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {renderHeader()}

      <div className="tabs tabs-boxed mb-8">
        <button
          className={`tab tab-lg ${activeTab === "active" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          🚀 活跃 ({activeProposals.length})
        </button>
        <button
          className={`tab tab-lg ${activeTab === "executed" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("executed")}
        >
          ✅ 已执行 ({executedProposals.length})
        </button>
        <button
          className={`tab tab-lg ${activeTab === "cancelled" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
        >
          ❌ 已失败 ({cancelledProposals.length})
        </button>
      </div>

      {/* 提案列表网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(() => {
          switch (activeTab) {
            case "active":
              if (activeProposals.length === 0) {
                return (
                  <div className="text-center py-8 col-span-full">
                    <p className="text-gray-500 text-lg">暂无活跃提案</p>
                  </div>
                );
              }
              return activeProposals.map(proposal => (
                <ProposalCard key={`${proposal.projectId}-${proposal.proposalId}`} proposal={proposal} />
              ));

            case "executed":
              if (executedProposals.length === 0) {
                return (
                  <div className="text-center py-8 col-span-full">
                    <p className="text-gray-500 text-lg">暂无已执行的提案</p>
                  </div>
                );
              }
              return executedProposals.map(proposal => (
                <ProposalCard key={`${proposal.projectId}-${proposal.proposalId}`} proposal={proposal} />
              ));

            case "cancelled":
              if (cancelledProposals.length === 0) {
                return (
                  <div className="text-center py-8 col-span-full">
                    <p className="text-gray-500 text-lg">暂无失败的提案</p>
                  </div>
                );
              }
              return cancelledProposals.map(proposal => (
                <ProposalCard key={`${proposal.projectId}-${proposal.proposalId}`} proposal={proposal} />
              ));

            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
}
