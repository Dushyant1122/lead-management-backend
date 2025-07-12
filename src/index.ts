import { config } from "dotenv";
config({ path: "./.env" });
import connectDatabase from "./db";
import app, { startApp } from "./app.ts";

const PORT = Number(process.env.PORT) || 4000;

async function startServer() {
  try {
    // First try to connect Database and after successfully connected run startApp()
    await connectDatabase();

    startApp();
    app.listen(PORT, () => {
      console.log("\n⚙️  Server is running on port:", PORT);
    });
  } catch (error: any) {
    console.error("\nFailed to start server:", error.stack);
  }
}

startServer();
