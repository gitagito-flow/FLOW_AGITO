import { db } from "../db/index.js";
import { teams, users, teamMembers } from "../db/schema.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = "password123";

// Data from frontend src/lib/teams.ts
const graphicTeams = [
    {
        name: "TEAM GESTY",
        members: [
            "Gesty Ariyadi",
            "Achmad Sofyan Alfarisyi",
            "Wildiya Balqis",
            "Agusti Maula Qahfi",
            "Salmon Mubarok Putra Pradana",
        ],
    },
    {
        name: "TEAM WISNU",
        members: [
            "Wisnu Adji Prasetyo",
            "Ananda Nabila Yahya",
            "Andria Fitriani",
            "Rizky Fitri Astuti",
        ],
    },
    {
        name: "TEAM REYZA",
        members: [
            "Faizal Reza",
            "Irwan Setiawan",
            "Renita Nimasari Puteri",
            "Moch Chandra Rinaldi",
            "Raden Kevin Verrel Julio Ananta",
        ],
    },
    {
        name: "TEAM FREDI",
        members: [
            "Fredi Mergiana",
            "Sasangka Bhima Asmara",
            "Arie Herdiansyah Ibrahim",
        ],
    },
    {
        name: "TEAM BERRY",
        members: [
            "Berry Anderson",
            "Bernard Panji Sujatmiko",
            "Deni Tri Sutrisna",
            "M. Alfin Huda",
        ],
    },
];

const motionTeams = [
    {
        name: "TEAM IMAM",
        members: [
            "Bagus Rizky Basuki",
            "Imam Handayana",
            "Ludira Tisan Satya Sukmaraja",
        ],
    },
    {
        name: "TEAM REY",
        members: [
            "Reyza Alvaraby",
            "Aldi Suhada",
            "Anjas Listyawan",
        ],
    },
    {
        name: "TEAM AGITO",
        members: [
            "Agit Apriadi",
            "Muhammad Rivan Riyana",
            "Aripan Nugraha Muhamad Ramdan",
        ],
    },
    {
        name: "TEAM ADRI",
        members: [
            "Muhamad Adri Graha Darajat",
            "Fadel Arthagena Fadilah",
            "Saddam",
        ],
    },
    {
        name: "TEAM CHIKO",
        members: [
            "Wardiansyah",
            "Luthfi Indra Muhammad",
            "Chicko Caesar Ferdinand",
            "Renaldi Alfiandy",
        ],
    },
];

const musicTeam = {
    name: "EZZA RUSH",
    members: [
        "Ezza Rush",
        "Zaid",
        "Julian",
        "Angga Ale",
        "Rimba",
    ],
};

function createInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function createEmail(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "") + "@oneflow.com";
}

async function seed() {
    console.log("🌱 Starting seed...");

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // Helper to process teams
    const processTeams = async (teamsData: { name: string; members: string[] }[], type: string) => {
        for (const teamData of teamsData) {
            console.log(`Processing team: ${teamData.name} (${type})`);

            // 1. Create Team
            const [newTeam] = await db
                .insert(teams)
                .values({
                    name: teamData.name,
                    type: type, // graphic, motion, music
                })
                .returning();

            // 2. Create Members and Link to Team
            for (const memberName of teamData.members) {
                const email = createEmail(memberName);
                const initials = createInitials(memberName);

                // Check if user exists
                let userId: string;
                const existingUser = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (existingUser) {
                    console.log(`  User exists: ${memberName} (${email})`);
                    userId = existingUser.id;
                } else {
                    console.log(`  Creating user: ${memberName} (${email})`);
                    const [newUser] = await db
                        .insert(users)
                        .values({
                            name: memberName,
                            email: email,
                            passwordHash: passwordHash,
                            initials: initials,
                            role: "member",
                        })
                        .returning();
                    userId = newUser.id;
                }

                // Link to Team
                // Check if link exists
                const existingLink = await db.query.teamMembers.findFirst({
                    where: (fields, { and, eq }) => and(eq(fields.userId, userId), eq(fields.teamId, newTeam.id)),
                });

                if (!existingLink) {
                    await db.insert(teamMembers).values({
                        userId: userId,
                        teamId: newTeam.id,
                    });
                }
            }
        }
    };

    await processTeams(graphicTeams, "graphic");
    await processTeams(motionTeams, "motion");
    await processTeams([{ name: musicTeam.name, members: musicTeam.members }], "music");

    console.log("✅ Seeding completed!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
