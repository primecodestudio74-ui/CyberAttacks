import mongoose from 'mongoose';

/**
 * Connect to MongoDB.
 *
 * Existing behaviour is preserved: the process stops when the database cannot
 * be reached. Set ALLOW_START_WITHOUT_DB=1 (documented in backend/.env.example)
 * to keep the server running anyway - useful for previewing features that do
 * not depend on the database, such as the Cyber News section, or for running
 * the news API while the database is being provisioned.
 * Auth/learning routes will simply fail until the connection is available.
 */
const connectDB = async () => {
  const allowWithoutDb = process.env.ALLOW_START_WITHOUT_DB === '1' || process.env.NODE_ENV === 'test';

  if (!process.env.MONGO_URI) {
    const message = 'MONGO_URI is not set.';
    if (allowWithoutDb) {
      console.warn(`⚠️  ${message} Continuing without a database (ALLOW_START_WITHOUT_DB=1).`);
      return null;
    }
    console.error(`❌ ${message}`);
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (allowWithoutDb) {
      console.warn(`⚠️  MongoDB unavailable (${error.message}). Continuing without a database.`);
      return null;
    }
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
    return null;
  }
};

export default connectDB;
