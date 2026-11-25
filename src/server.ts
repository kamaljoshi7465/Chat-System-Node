import "dotenv/config";

import app from "./app";
import prisma from "./config/database";

const PORT = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  try {
    // Verify PostgreSQL connection
    await prisma.$connect();

    console.log("PostgreSQL connected successfully!");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
