import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface CreateProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProjectForm({ isOpen, onClose, onSuccess }: CreateProjectFormProps) {
  const { address } = useAccount();
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    goal: "",
    deadlineDate: "",
    deadlineTime: "12:00", // 默认中午12点
  });
  const [isCreating, setIsCreating] = useState(false);

  const { writeContractAsync: createProject } = useScaffoldWriteContract({
    contractName: "Crowdfunding",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("请先连接钱包");
      return;
    }

    if (!projectData.name || !projectData.description || !projectData.goal || !projectData.deadlineDate) {
      alert("请填写所有必填字段");
      return;
    }

    try {
      setIsCreating(true);

      // 合并日期和时间，精确到小时
      const deadlineDateTime = new Date(`${projectData.deadlineDate}T${projectData.deadlineTime}`);
      const deadlineTimestamp = Math.floor(deadlineDateTime.getTime() / 1000);

      await createProject({
        functionName: "createProject",
        args: [
          projectData.name,
          projectData.description,
          BigInt(Math.floor(parseFloat(projectData.goal) * 1e18)),
          BigInt(deadlineTimestamp),
        ],
      });

      alert("项目创建成功！");

      // 重置表单
      setProjectData({
        name: "",
        description: "",
        goal: "",
        deadlineDate: "",
        deadlineTime: "12:00",
      });

      // 调用成功回调
      onSuccess?.();

      // 关闭模态框
      onClose();
    } catch (error) {
      console.error("创建项目失败:", error);
      alert("创建项目失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h2 className="font-bold text-lg mb-4">创建新项目</h2>

        {!address ? (
          <div className="text-center py-4">
            <p className="mb-4">请先连接钱包以创建项目</p>
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById("connect_wallet_button")?.click()}
            >
              连接钱包
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">项目名称 *</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="输入项目名称"
                className="input input-bordered input-sm"
                value={projectData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">项目描述 *</span>
              </label>
              <textarea
                name="description"
                placeholder="详细描述您的项目，包括目标、用途、预期成果等"
                className="textarea textarea-bordered h-20 textarea-sm"
                value={projectData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">众筹目标 (ETH) *</span>
                </label>
                <input
                  type="number"
                  name="goal"
                  placeholder="例如: 10"
                  className="input input-bordered input-sm"
                  value={projectData.goal}
                  onChange={handleChange}
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">截止日期和时间 *</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    name="deadlineDate"
                    className="input input-bordered input-sm"
                    value={projectData.deadlineDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <input
                    type="time"
                    name="deadlineTime"
                    className="input input-bordered input-sm"
                    value={projectData.deadlineTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isCreating}>
                取消
              </button>
              <button type="submit" className={`btn btn-primary ${isCreating ? "loading" : ""}`} disabled={isCreating}>
                {isCreating ? "创建中..." : "创建项目"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
