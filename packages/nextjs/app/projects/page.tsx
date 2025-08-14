"use client";

import { useState } from "react";
import { CreateProjectForm } from "./_components/CreateProjectForm";
import { ProjectList } from "./_components/ProjectList";
import { Project } from "./types";
import { useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { formatTimestampToDate } from "~~/utils/crowdfunding-utils";

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<"live" | "successful" | "failed">("live");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 直接读取合约中的项目数量
  const { data: projectCount } = useScaffoldReadContract({
    contractName: "Crowdfunding",
    functionName: "getProjectCount",
  });

  // 监听链上项目创建事件，从合约部署区块开始监听
  const {
    data: projectEvents,
    isLoading,
    error,
    refetch,
  } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "ProjectCreated",
    fromBlock: 8980233n,
    watch: true,
    filters: {},
  });

  // 监听项目完成事件，从合约部署区块开始监听
  const { data: completedEvents } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "ProjectCompleted",
    fromBlock: 8980233n,
    watch: true,
    filters: {},
  });

  // 监听项目失败事件，从合约部署区块开始监听
  const { data: failedEvents } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "ProjectFailed",
    fromBlock: 8980233n,
    watch: true,
    filters: {},
  });

  // 处理项目数据
  const projects: Project[] =
    projectEvents
      ?.reduce((uniqueProjects: Project[], event) => {
        const projectId = Number(event.args.id);

        // 检查是否已处理过该项目
        const existingProject = uniqueProjects.find(p => p.id === projectId);
        if (existingProject) {
          // 如果项目已存在，跳过以避免重复
          return uniqueProjects;
        }

        // 检查项目是否已完成
        const completedEvent = completedEvents?.find(compEvent => Number(compEvent.args.id) === projectId);

        // 检查项目是否已失败
        const failedEvent = failedEvents?.find(failEvent => Number(failEvent.args.id) === projectId);

        const isCompleted = !!completedEvent || !!failedEvent;
        const isSuccessful = completedEvent ? Boolean(completedEvent.args.isSuccessful) : false;
        const isFailed = !!failedEvent || (isCompleted && !isSuccessful);

        let status: "live" | "successful" | "failed" = "live";
        if (isFailed) {
          status = "failed";
        } else if (isSuccessful) {
          status = "successful";
        }

        const newProject: Project = {
          id: projectId,
          name: event.args.name || "未命名项目",
          description: event.args.description || "暂无描述",
          goal: event.args.goal || 0n,
          raised: 0n,
          totalAmount: 0n,
          deadline: formatTimestampToDate(Number(event.args.deadline)),
          creator: event.args.creator || "",
          owner: event.args.creator || "",
          completed: isCompleted,
          successful: isSuccessful,
          failed: isFailed,
          status,
          totalWithdrawn: 0,
        };

        // 只有当项目有有效名称和创建者时才添加
        if (newProject.name && newProject.creator) {
          return [...uniqueProjects, newProject];
        }

        return uniqueProjects;
      }, [])
      .filter(project => project.name && project.creator) || []; // 过滤掉关键字段为空的项目

  const liveProjects = projects.filter(project => project.status === "live");
  const successfulProjects = projects.filter(project => project.status === "successful");
  const failedProjects = projects.filter(project => project.status === "failed");

  const handleProjectCreated = () => {
    // 重新获取项目数据以显示新创建的项目
    refetch();
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">项目列表</h1>
        {projectCount !== undefined && <p className="text-sm text-gray-500">总项目数: {projectCount.toString()}</p>}
      </div>
      <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? "取消" : "创建项目"}
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {renderHeader()}
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">正在加载项目数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        {renderHeader()}
        <div className="alert alert-error">
          <span>加载项目数据时出错: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {renderHeader()}

      {showCreateForm && (
        <div className="mb-8">
          <CreateProjectForm
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleProjectCreated}
          />
        </div>
      )}

      <div className="tabs tabs-boxed mb-8">
        <button
          className={`tab tab-lg ${activeTab === "live" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("live")}
        >
          🚀 进行中 ({liveProjects.length})
        </button>
        <button
          className={`tab tab-lg ${activeTab === "successful" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("successful")}
        >
          ✅ 已成功 ({successfulProjects.length})
        </button>
        <button
          className={`tab tab-lg ${activeTab === "failed" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("failed")}
        >
          ❌ 已失败 ({failedProjects.length})
        </button>
      </div>

      <ProjectList
        activeTab={activeTab}
        liveProjects={liveProjects}
        successfulProjects={successfulProjects}
        failedProjects={failedProjects}
      />
    </div>
  );
}
