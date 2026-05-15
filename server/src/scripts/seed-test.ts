import "reflect-metadata";
import * as bcrypt from "bcrypt";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { User } from "../modules/users/user.entity.js";
import { UserRole } from "../common/enums/user-role.enum.js";

config({ path: ".env" });

const PASSWORD_ROUNDS = 12;

const TEST_USERS = [
  {
    name: "E2E Admin",
    email: "e2e-admin@test.com",
    password: "AdminPass123",
    role: UserRole.ADMIN,
  },
  {
    name: "E2E Manager",
    email: "e2e-manager@test.com",
    password: "ManagerPass123",
    role: UserRole.MANAGER,
  },
  {
    name: "E2E Viewer",
    email: "e2e-viewer@test.com",
    password: "ViewerPass123",
    role: UserRole.VIEWER,
  },
];

async function seedTest(): Promise<void> {
  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const usersRepo = dataSource.getRepository(User);

    for (const userData of TEST_USERS) {
      const existing = await usersRepo.findOne({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`Test user already exists: ${userData.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, PASSWORD_ROUNDS);

      const user = usersRepo.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        isActive: true,
      });

      await usersRepo.save(user);
      console.log(`Test user seeded: ${userData.email} (${userData.role})`);
    }

    console.log("Test seed complete.");
  } finally {
    await dataSource.destroy();
  }
}

seedTest().catch((err) => {
  console.error("Test seed failed:", err);
  process.exit(1);
});
