import "reflect-metadata";
import * as bcrypt from "bcrypt";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { UserRole } from "../common/enums/user-role.enum.js";
import { User } from "../modules/users/user.entity.js";

config({ path: ".env" });

const PASSWORD_ROUNDS = 12;

async function seed(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [User],
    synchronize: false,
    ssl: process.env.DATABASE_URL?.includes("supabase.com") ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();

  try {
    const usersRepo = dataSource.getRepository(User);

    const existing = await usersRepo.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      console.log(`Admin user already exists: ${email}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_ROUNDS);

    const admin = usersRepo.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await usersRepo.save(admin);

    console.log(`Admin user seeded: ${email}`);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
