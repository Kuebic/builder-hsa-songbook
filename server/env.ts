// Load environment variables before anything else
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of this file to ensure correct path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple locations for .env file
const possibleEnvPaths = [
  path.resolve(process.cwd(), ".env"), // Current working directory
  path.resolve(__dirname, "../.env"), // One level up from server directory
  path.resolve(__dirname, "../../.env"), // Two levels up (for nested builds)
];

let envLoaded = false;
let loadedPath = "";

// Try each possible path until we find a .env file
for (const envPath of possibleEnvPaths) {
  const result = dotenv.config({ path: envPath });
  
  if (!result.error) {
    envLoaded = true;
    loadedPath = envPath;
    console.log(`✅ Loaded environment variables from: ${envPath}`);
    break;
  }
}

if (!envLoaded) {
  console.warn("⚠️  Could not find .env file in any of the following locations:");
  possibleEnvPaths.forEach(p => console.warn(`   - ${p}`));
  console.log("💡 Using system environment variables as fallback");
}

// Validate required environment variables
const requiredEnvVars = ["MONGODB_URI", "VITE_CLERK_PUBLISHABLE_KEY"];
const missingEnvVars: string[] = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
}

// Log environment variable status
if (process.env.MONGODB_URI) {
  // Mask the MongoDB URI for security
  const maskedUri = process.env.MONGODB_URI.replace(
    /mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@/,
    "mongodb://*****:*****@",
  );
  console.log(`✅ MONGODB_URI is available: ${maskedUri}`);
} else {
  console.error("❌ MONGODB_URI is not defined in environment variables");
}

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach(v => console.error(`   - ${v}`));
  console.log("\n💡 Please ensure all required variables are set in your .env file:");
  console.log("   MONGODB_URI=mongodb://...");
  console.log("   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...");
  
  // In development, show more helpful error
  if (process.env.NODE_ENV === "development") {
    console.log("\n📝 Create a .env file in your project root with the above variables");
    console.log("   You can copy .env.example as a starting point");
  }
}

// Export environment info for debugging
export const envInfo = {
  loaded: envLoaded,
  path: loadedPath,
  hasMongoDB: !!process.env.MONGODB_URI,
  hasClerk: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
  nodeEnv: process.env.NODE_ENV || "development",
};