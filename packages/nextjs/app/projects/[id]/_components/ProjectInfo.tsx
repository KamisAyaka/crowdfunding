import { Project } from "../../types";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface ProjectInfoProps {
  project: Project;
  projectId: number;
}

export function ProjectInfo({ project, projectId }: ProjectInfoProps) {
  // 获取AllowenceIncreased事件来动态计算可提取资金
  const { data: allowenceIncreasedEvents } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "AllowenceIncreased",
    fromBlock: 0n,
    filters: {
      id: BigInt(projectId),
    },
    watch: true,
  });

  // 获取提案失败次数
  const { data: proposalFailureCount } = useScaffoldReadContract({
    contractName: "ProposalGovernance",
    functionName: "proposalFailureCount",
    args: [BigInt(projectId)],
  });

  // 计算可提取资金
  let withdrawableAmount = 0n;

  // 只有项目成功时才计算可提取资金
  if (project.completed && project.successful) {
    // 直接使用项目当前的allowence值
    withdrawableAmount = project.allowence ? BigInt(project.allowence) : 0n;
  }

  // 使用从链上获取的已提取资金数据
  const withdrawnAmount = project.totalWithdrawn ? BigInt(project.totalWithdrawn) : 0n;

  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h1 className="card-title text-5xl">
          项目 #{project.id}: {project.name || "未知项目"}
        </h1>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-2xl font-medium">项目发起人:</span>
          {project.owner ? <Address address={project.owner} /> : "未知"}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="stat">
            <div className="stat-title text-xl">已筹集</div>
            <div className="stat-value text-primary text-4xl">{(Number(project.raised) / 1e18).toFixed(2)} ETH</div>
            <div className="stat-desc text-lg">目标: {(Number(project.goal) / 1e18).toFixed(2)} ETH</div>
          </div>

          {/* 可提取资金状态 */}
          {project.completed && project.successful && (
            <div className="stat">
              <div className="stat-title text-xl">可提取资金</div>
              <div className="stat-value text-secondary text-4xl">
                {(Number(withdrawableAmount) / 1e18).toFixed(2)} ETH
              </div>
              <div className="stat-desc text-lg">总筹款: {(Number(project.totalAmount) / 1e18).toFixed(2)} ETH</div>
            </div>
          )}

          {/* 已提取资金状态 */}
          {project.completed && project.successful && (
            <div className="stat">
              <div className="stat-title text-xl">已提取资金</div>
              <div className="stat-value text-accent text-4xl">{(Number(withdrawnAmount) / 1e18).toFixed(2)} ETH</div>
              <div className="stat-desc text-lg">
                剩余可提取: {((Number(withdrawableAmount) - Number(withdrawnAmount)) / 1e18).toFixed(2)} ETH
              </div>
            </div>
          )}

          {/* 提案失败次数统计 */}
          <div className="stat">
            <div className="stat-title text-xl">提案失败次数</div>
            <div className="stat-value text-warning text-4xl">
              {proposalFailureCount !== undefined ? proposalFailureCount.toString() : "0"}
            </div>
            <div className="stat-desc text-lg">连续失败3次项目将失败</div>
          </div>

          {/* 项目失败状态 */}
          {project.completed && !project.successful && (
            <div className="stat md:col-span-3">
              <div className="stat-title text-xl">项目状态</div>
              <div className="stat-value text-error text-4xl">项目失败</div>
              <div className="stat-desc text-lg">
                提案已连续失败 {proposalFailureCount !== undefined ? proposalFailureCount.toString() : "0"} 次
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">项目描述</h2>
          <p className="text-lg">{project.description || "暂无描述"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">截止日期</h3>
            <p className="text-lg">{project.deadline || "未知"}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">项目状态</h3>
            {project.completed ? (
              project.successful ? (
                <div className="badge badge-success text-white font-bold text-lg">众筹成功</div>
              ) : (
                <div className="badge badge-error text-white font-bold text-lg">众筹失败</div>
              )
            ) : (
              <div className="badge badge-primary text-white font-bold text-lg">进行中</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
