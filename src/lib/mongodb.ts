
import { MongoClient, Db } from 'mongodb';

// --- BEGIN DEBUG LOGS ---
console.log('--- DEBUG START: src/lib/mongodb.ts ---');
const MONGODB_URI_FROM_ENV = process.env.MONGODB_URI;
const MONGODB_DB_NAME_FROM_ENV = process.env.MONGODB_DB_NAME;

console.log('[MongoDB DEBUG] MONGODB_URI from process.env:', MONGODB_URI_FROM_ENV ? '****** (loaded)' : 'NOT SET');
console.log('[MongoDB DEBUG] MONGODB_DB_NAME from process.env:', MONGODB_DB_NAME_FROM_ENV ? MONGODB_DB_NAME_FROM_ENV + ' (loaded)' : 'NOT SET');
// --- END DEBUG LOGS ---

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient | null, db: Db | null }> {
  if (!MONGODB_URI_FROM_ENV) {
    const errorMessage = 'CRITICAL SERVER CONFIG ERROR: MONGODB_URI environment variable is NOT DEFINED. Your application cannot connect to the database. Please check your .env file at the project root, ensure it is correctly formatted (MONGODB_URI="your_connection_string"), and RESTART your Next.js development server. This error will appear in your SERVER TERMINAL LOGS.';
    console.error(`\n\n🛑🛑🛑 ${errorMessage} 🛑🛑🛑\n\n`);
    return { client: null, db: null }; // Return nulls instead of throwing at module scope
  }

  if (!MONGODB_DB_NAME_FROM_ENV) {
    const errorMessage = 'CRITICAL SERVER CONFIG ERROR: MONGODB_DB_NAME environment variable is NOT DEFINED. Your application cannot connect to the database. Please check your .env file at the project root (e.g., MONGODB_DB_NAME="Swapzo") and RESTART your Next.js development server. This error will appear in your SERVER TERMINAL LOGS.';
    console.error(`\n\n🛑🛑🛑 ${errorMessage} 🛑🛑🛑\n\n`);
    return { client: null, db: null }; // Return nulls
  }

  if (cachedClient && cachedDb) {
    try {
      await cachedClient.db(MONGODB_DB_NAME_FROM_ENV).command({ ping: 1 });
      // console.log('[MongoDB DEBUG] Using cached MongoDB connection.');
      return { client: cachedClient, db: cachedDb };
    } catch (e) {
      console.warn('[MongoDB WARN] Cached MongoDB client connection lost. Attempting to reconnect...', e);
      cachedClient = null;
      cachedDb = null;
    }
  }

  // console.log('[MongoDB DEBUG] Attempting new MongoDB connection...');
  const client = new MongoClient(MONGODB_URI_FROM_ENV);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB_NAME_FROM_ENV);
    
    cachedClient = client;
    cachedDb = db;
    
    // console.log('[MongoDB DEBUG] Successfully connected to MongoDB Atlas!');
    return { client, db };
  } catch (error: any) {
    console.error(`\n\n🆘🆘🆘 [MongoDB CONNECTION ERROR] 🆘🆘🆘
    Failed to connect to MongoDB Atlas.
    URI used (password redacted): ${MONGODB_URI_FROM_ENV.replace(/\/\/(.+?):(.+?)@/, '//<user>:******@')}
    DB Name used: ${MONGODB_DB_NAME_FROM_ENV}
    
    Potential Causes & Solutions:
    1. Incorrect Password: Double-check the password for user 'swapzo' in your MONGODB_URI in the .env file. Ensure special characters are URL-encoded if necessary.
    2. IP Whitelist: In MongoDB Atlas, ensure your current IP address OR 0.0.0.0/0 (Allow Access from Anywhere - for development) is whitelisted.
       - Your Dev Server IP: (You might need to find this, or use 0.0.0.0/0 for testing)
       - Firebase/Cloud Run IPs (if deployed): Typically requires 0.0.0.0/0 or specific Google Cloud IP ranges.
    3. Incorrect Cluster/DB Name: Verify the cluster address in the URI and the MONGODB_DB_NAME.
    4. Network Issues: Check for firewalls, VPNs, or general internet connectivity problems.
    5. Database User Permissions: Ensure the 'swapzo' user has the necessary permissions for the '${MONGODB_DB_NAME_FROM_ENV}' database.
    
    Original Error Message: ${error.message}
    Full Error:`, error, '\n\n');
    
    try {
        if (client && typeof client.close === 'function') {
            await client.close();
        }
    } catch (closeError) {
        console.error('[MongoDB ERROR] Error while trying to close MongoDB client after connection failure:', closeError);
    }
    // Instead of throwing, which leads to the generic Next.js error page,
    // we'll return nulls. Code using this must handle the null case.
    return { client: null, db: null };
  }
}

// Optional: A simple function to get just the Db instance
export async function getDb(): Promise<Db | null> {
  const { db } = await connectToDatabase();
  if (!db) {
    console.error("🛑 [getDb] Failed to get database instance because connectToDatabase returned null. Check previous logs for critical errors.");
  }
  return db;
}

console.log('--- DEBUG END: src/lib/mongodb.ts ---');
