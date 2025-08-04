import "dotenv/config";
import mongoose from "mongoose";

console.log("🔍 MongoDB Connection Test");
console.log("==========================");

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("❌ MONGODB_URI environment variable is not set");
  process.exit(1);
}

// Mask the URI for security (show only the protocol and first few chars)
const maskedUri = mongoUri.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, "mongodb$1://[user]:[password]@");
console.log("📍 MongoDB URI (masked):", maskedUri);

console.log("\n🔗 Attempting to connect...");

// Set strict timeout and simple options
mongoose.set("bufferCommands", false);

const connectOptions = {
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  bufferCommands: false,
};

console.log("⚙️  Connection options:", connectOptions);

async function testConnection() {
  try {
    console.log("\n⏱️  Starting connection...");
    const startTime = Date.now();
    
    await mongoose.connect(mongoUri, connectOptions);
    
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connected successfully in ${connectTime}ms`);
    console.log("📊 Connection state:", mongoose.connection.readyState);
    console.log("🏷️  Database name:", mongoose.connection.name);
    
    // Test a simple operation
    console.log("\n🧪 Testing database operation...");
    const testStart = Date.now();
    
    try {
      const admin = mongoose.connection.db.admin();
      const info = await admin.ping();
      const opTime = Date.now() - testStart;
      console.log(`✅ Database ping successful in ${opTime}ms:`, info);
    } catch (opError) {
      console.error("❌ Database operation failed:", opError.message);
    }
    
    // Get connection info
    console.log("\n📋 Connection Details:");
    console.log("   Host:", mongoose.connection.host);
    console.log("   Port:", mongoose.connection.port);
    console.log("   Ready state:", mongoose.connection.readyState);
    
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error("   Error type:", error.constructor.name);
    console.error("   Message:", error.message);
    
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    
    if (error.code) {
      console.error("   Code:", error.code);
    }
    
    // Common connection issues
    if (error.message.includes("authentication failed")) {
      console.error("\n💡 This looks like an authentication issue. Check:");
      console.error("   - Username and password in the URI");
      console.error("   - Database user permissions");
    } else if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
      console.error("\n💡 This looks like a timeout issue. Check:");
      console.error("   - Network connectivity");
      console.error("   - MongoDB Atlas IP whitelist");
      console.error("   - Firewall settings");
    } else if (error.message.includes("hostname") || error.message.includes("ENOTFOUND")) {
      console.error("\n💡 This looks like a DNS/hostname issue. Check:");
      console.error("   - MongoDB URI format");
      console.error("   - Cluster hostname");
    }
    
  } finally {
    console.log("\n🔚 Closing connection...");
    try {
      await mongoose.disconnect();
      console.log("✅ Disconnected successfully");
    } catch (disconnectError) {
      console.error("❌ Error during disconnect:", disconnectError.message);
    }
  }
}

testConnection();
