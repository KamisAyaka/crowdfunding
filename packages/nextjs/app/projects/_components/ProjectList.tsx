import { Project } from "../types";
import { ProjectCard } from "./ProjectCard";

export function ProjectList({
  activeTab,
  liveProjects,
  successfulProjects,
  failedProjects,
}: {
  activeTab: "live" | "successful" | "failed";
  liveProjects: Project[];
  successfulProjects: Project[];
  failedProjects: Project[];
}) {
  const renderProjects = (projects: Project[], emptyMessage: string) => {
    if (projects.length === 0) {
      return (
        <div className="text-center py-8 col-span-full">
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      );
    }
    return projects.map(project => <ProjectCard key={project.id} project={project} />);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(() => {
        switch (activeTab) {
          case "live":
            return renderProjects(liveProjects, "暂无进行中的项目");

          case "successful":
            return renderProjects(successfulProjects, "暂无成功的项目");

          case "failed":
            return renderProjects(failedProjects, "暂无失败的项目");

          default:
            return null;
        }
      })()}
    </div>
  );
}
