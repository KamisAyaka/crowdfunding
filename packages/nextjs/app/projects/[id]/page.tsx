"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Donation } from "../types";
import { Project } from "../types";
import { DonationLeaderboard } from "./_components/DonationLeaderboard";
import { ProjectActionButtons } from "./_components/ProjectActionButtons";
import { ProjectInfo } from "./_components/ProjectInfo";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { formatTimestampToDate } from "~~/utils/crowdfunding-utils";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { address } = useAccount();
  const projectId = id ? (Array.isArray(id) ? parseInt((id[0] as string) || "0") : parseInt((id as string) || "0")) : 0;

  // 获取合约部署信息
  const { data: deployedContract } = useDeployedContractInfo({ contractName: "Crowdfunding" });
  const fromBlock = deployedContract?.deployedOnBlock ?? 0n;

  // 获取项目信息
  const { data: projectData, isLoading: projectLoading } = useScaffoldReadContract({
    contractName: "Crowdfunding",
    functionName: "projects",
    args: [BigInt(projectId)],
  });

  // 获取项目创建事件
  const { data: projectEvents } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "ProjectCreated",
    fromBlock: BigInt(fromBlock as bigint),
    filters: {
      id: BigInt(projectId),
    },
    watch: true,
  });

  const projectEvent = projectEvents?.[0];

  // 获取项目完成事件
  const { data: completedEvents } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "ProjectCompleted",
    fromBlock: BigInt(fromBlock as bigint),
    filters: {
      id: BigInt(projectId),
    },
    watch: true,
  });

  const completedEvent = completedEvents?.[0];
  const isCompleted = !!completedEvent;
  const isSuccessful = completedEvent ? completedEvent.args.isSuccessful : false;

  // 获取捐赠事件
  const { data: donationEvents } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "DonationMade",
    fromBlock: BigInt(fromBlock as bigint),
    filters: {
      id: BigInt(projectId),
    },
    watch: true,
  });

  // 获取资金提取事件
  const { data: fundsWithdrawnEvents } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "FundsWithdrawn",
    fromBlock: BigInt(fromBlock as bigint),
    filters: {
      id: BigInt(projectId),
    },
    watch: true,
  });

  // 计算捐赠者排行榜
  const donationLeaderboard =
    donationEvents?.reduce((acc: Donation[], event: any) => {
      const donor = event.args.donor;
      const amount = Number(event.args.amount);

      const existingDonor = acc.find(d => d.address === donor);
      if (existingDonor) {
        existingDonor.totalAmount += amount;
        existingDonor.donationCount += 1;
      } else {
        acc.push({
          address: donor,
          totalAmount: amount,
          donationCount: 1,
        });
      }

      return acc;
    }, []) || [];

  // 按捐赠总额排序，并只取前5名
  donationLeaderboard.sort((a, b) => b.totalAmount - a.totalAmount);
  const topFiveDonors = donationLeaderboard.slice(0, 5);

  // 计算已提取资金总额
  const totalWithdrawn = fundsWithdrawnEvents?.reduce((sum, event) => sum + Number(event.args.amount), 0) || 0;

  // 构建项目对象
  const project =
    projectData && projectEvent
      ? ({
          id: Number(projectEvent.args.id),
          name: projectEvent.args.name || "未命名项目",
          description: projectEvent.args.description || "暂无描述",
          goal: projectData[4], // goal
          raised: projectData[6], // currentAmount - 当前剩余可提取金额
          totalAmount: projectData[7], // totalAmount - 项目完成时的总筹款金额
          deadline: formatTimestampToDate(Number(projectEvent.args.deadline)),
          creator: projectEvent.args.creator || "",
          owner: projectEvent.args.creator || "",
          isCompleted,
          isSuccessful,
          totalWithdrawn,
          status: isCompleted ? (isSuccessful ? "successful" : "failed") : "live",
          completed: isCompleted,
          successful: isSuccessful,
          failed: !isSuccessful && isCompleted, // 明确设置项目失败状态
          allowence: projectData[8], // 添加allowence属性
        } as Project | null)
      : null;

  if (projectLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">正在加载项目数据...</p>
        </div>
      </div>
    );
  }

  // 移除了 projectId <= 0 的检查，允许访问项目0
  if (!project || isNaN(projectId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">项目未找到</h2>
          <p>无法找到指定的项目</p>
          <Link href="/projects" className="btn btn-primary mt-4">
            返回项目列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectInfo project={project} projectId={projectId} />

      <ProjectActionButtons project={project} address={address} topFiveDonors={topFiveDonors} projectId={projectId} />

      <DonationLeaderboard topFiveDonors={topFiveDonors} />
    </div>
  );
}
