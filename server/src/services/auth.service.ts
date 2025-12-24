import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, NewUser } from "../db/schema.js";
import { env } from "../config/env.js";

const SALT_ROUNDS = 10;

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export async function registerUser(input: RegisterInput) {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.email),
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create initials from name
    const nameParts = input.name.split(" ");
    const initials =
        nameParts.length === 1
            ? nameParts[0].substring(0, 2).toUpperCase()
            : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

    // Insert user
    const [newUser] = await db
        .insert(users)
        .values({
            email: input.email,
            passwordHash,
            name: input.name,
            initials,
        })
        .returning();

    // Generate token
    const token = generateToken(newUser);

    return {
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            initials: newUser.initials,
            role: newUser.role,
        },
        token,
    };
}

export async function loginUser(input: LoginInput) {
    // Find user
    const user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValidPassword) {
        throw new Error("Invalid email or password");
    }

    // Generate token
    const token = generateToken(user);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            initials: user.initials,
            role: user.role,
            avatarUrl: user.avatarUrl,
        },
        token,
    };
}

export async function getUserById(userId: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        initials: user.initials,
        role: user.role,
        avatarUrl: user.avatarUrl,
    };
}

export async function updateUser(
    userId: string,
    updates: { name?: string; avatarUrl?: string }
) {
    const [updated] = await db
        .update(users)
        .set({
            ...updates,
            initials: updates.name ? createInitials(updates.name) : undefined,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

    return updated;
}

function generateToken(user: { id: string; email: string; role: string }) {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn }
    );
}

function createInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
