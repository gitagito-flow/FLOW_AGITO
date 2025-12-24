import { Project } from "./types";

const STORAGE_KEY = "oneflow-projects";
const USER_NAME_KEY = "oneflow-current-user";

export const getProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProjects = (projects: Project[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const getProjectById = (id: string): Project | undefined => {
  const projects = getProjects();
  return projects.find((p) => p.id === id);
};

export const updateProject = (updatedProject: Project): void => {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === updatedProject.id);
  if (index !== -1) {
    projects[index] = updatedProject;
    saveProjects(projects);
  }
};

export const deleteProject = (id: string): void => {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  saveProjects(filtered);
};

export const addProject = (project: Project): void => {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
};

// New User Management Functions
export const getCurrentUserName = (): string | null => {
  return localStorage.getItem(USER_NAME_KEY);
};

export const setCurrentUserName = (name: string): void => {
  localStorage.setItem(USER_NAME_KEY, name);
};