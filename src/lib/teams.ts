import { Team } from "./types";
import { Project, TeamMember } from "./types"; // Import Project dan TeamMember

const createInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const createTeamMembers = (names: string[]) => {
  return names.map((name, index) => ({
    id: `member-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    initials: createInitials(name),
  }));
};

export const graphicTeams: Team[] = [
  {
    id: "team-gesty",
    name: "TEAM GESTY",
    members: createTeamMembers([
      "Gesty Ariyadi",
      "Achmad Sofyan Alfarisyi",
      "Wildiya Balqis",
      "Agusti Maula Qahfi",
      "Salmon Mubarok Putra Pradana",
    ]),
  },
  {
    id: "team-wisnu",
    name: "TEAM WISNU",
    members: createTeamMembers([
      "Wisnu Adji Prasetyo",
      "Ananda Nabila Yahya",
      "Andria Fitriani",
      "Rizky Fitri Astuti",
    ]),
  },
  {
    id: "team-reyza",
    name: "TEAM REYZA",
    members: createTeamMembers([
      "Faizal Reza",
      "Irwan Setiawan",
      "Renita Nimasari Puteri",
      "Moch Chandra Rinaldi",
      "Raden Kevin Verrel Julio Ananta",
    ]),
  },
  {
    id: "team-fredi",
    name: "TEAM FREDI",
    members: createTeamMembers([
      "Fredi Mergiana",
      "Sasangka Bhima Asmara",
      "Arie Herdiansyah Ibrahim",
    ]),
  },
  {
    id: "team-berry",
    name: "TEAM BERRY",
    members: createTeamMembers([
      "Berry Anderson",
      "Bernard Panji Sujatmiko",
      "Deni Tri Sutrisna",
      "M. Alfin Huda",
    ]),
  },
];

export const motionTeams: Team[] = [
  {
    id: "team-imam",
    name: "TEAM IMAM",
    members: createTeamMembers([
      "Bagus Rizky Basuki",
      "Imam Handayana",
      "Ludira Tisan Satya Sukmaraja",
    ]),
  },
  {
    id: "team-rey",
    name: "TEAM REY",
    members: createTeamMembers([
      "Reyza Alvaraby",
      "Aldi Suhada",
      "Anjas Listyawan",
    ]),
  },
  {
    id: "team-agito",
    name: "TEAM AGITO",
    members: createTeamMembers([
      "Agit Apriadi",
      "Muhammad Rivan Riyana",
      "Aripan Nugraha Muhamad Ramdan",
    ]),
  },
  {
    id: "team-adri",
    name: "TEAM ADRI",
    members: createTeamMembers([
      "Muhamad Adri Graha Darajat",
      "Fadel Arthagena Fadilah",
      "Saddam",
    ]),
  },
  {
    id: "team-chiko",
    name: "TEAM CHIKO",
    members: createTeamMembers([
      "Wardiansyah",
      "Luthfi Indra Muhammad",
      "Chicko Caesar Ferdinand",
      "Renaldi Alfiandy",
    ]),
  },
];

export const musicTeam: Team = {
  id: "team-ezza",
  name: "EZZA RUSH",
  members: createTeamMembers([
    "Ezza Rush",
    "Zaid",
    "Julian",
    "Angga Ale",
    "Rimba",
  ]),
};

export const allTeams = [...graphicTeams, ...motionTeams, musicTeam];

export const getMemberById = (memberId: string) => {
  for (const team of allTeams) {
    const member = team.members.find((m) => m.id === memberId);
    if (member) return member;
  }
  return null;
};

export const getTeamById = (teamId: string) => {
  return allTeams.find(team => team.id === teamId);
};

export const getMemberDivision = (memberId: string): "graphic" | "motion" | "music" | null => {
  for (const team of graphicTeams) {
    if (team.members.some(m => m.id === memberId)) return "graphic";
  }
  for (const team of motionTeams) {
    if (team.members.some(m => m.id === memberId)) return "motion";
  }
  if (musicTeam.members.some(m => m.id === memberId)) return "music";
  return null;
};

// Helper function to get all members from project's selected teams, grouped by category
export const getProjectMembers = (project: Project | null) => { // Allow project to be null
  const members: {
    graphic: TeamMember[];
    motion: TeamMember[];
    music: TeamMember[];
  } = { graphic: [], motion: [], music: [] };

  if (!project) { // Handle null project gracefully
    return members;
  }

  allTeams.forEach(team => {
    if (project.graphicTeams.includes(team.id)) {
      members.graphic.push(...team.members);
    }
    if (project.motionTeams.includes(team.id)) {
      members.motion.push(...team.members);
    }
    if (project.musicTeams.includes(team.id)) {
      members.music.push(...team.members);
    }
  });
  return members;
};