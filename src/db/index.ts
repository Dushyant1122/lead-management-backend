import mongoose, { Mongoose } from "mongoose";

const { MONGODB_URI } = process.env;

let dbInstance: Mongoose;

async function connectDatabase() {
  try {
    const connectionInstance = await mongoose.connect(`${MONGODB_URI}`);

    dbInstance = connectionInstance;
    console.log(
      `\n☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDb connection error", error);
    process.exit(1);
  }
}

export { dbInstance };
export default connectDatabase;
