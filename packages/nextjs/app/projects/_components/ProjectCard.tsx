import Link from "next/link";
import { Project } from "../types";
import { Address } from "~~/components/scaffold-eth";
import { formatEthAmountFixed2 } from "~~/utils/crowdfunding-utils";

export function ProjectCard({ project }: { project: Project }) {
  // 根据项目状态确定显示的徽章
  const getStatusBadge = () => {
    switch (project.status) {
      case "live":
        return <div className="badge badge-primary">进行中</div>;
      case "successful":
        return <div className="badge badge-success">已成功</div>;
      case "failed":
        return <div className="badge badge-error">已失败</div>;
      default:
        return <div className="badge badge-ghost">未知</div>;
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm h-full hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <h2 className="card-title">{project.name}</h2>
          {getStatusBadge()}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1 text-sm">
            <span>创建者:</span>
            <Address address={project.creator} size="sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="stat p-2">
            <div className="stat-title text-xs">众筹目标</div>
            <div className="stat-value text-sm">{formatEthAmountFixed2(project.goal)} ETH</div>
          </div>

          <div className="stat p-2">
            <div className="stat-title text-xs">截止日期</div>
            <div className="stat-value text-sm">{project.deadline}</div>
          </div>
        </div>

        <div className="card-actions justify-end mt-2">
          <Link href={`/projects/${project.id}`} className="btn btn-primary btn-sm">
            查看详情
          </Link>
        </div>
      </div>
    </div>
  );
}
