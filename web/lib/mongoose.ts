import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

export async function connectMongoose() {
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  if (!global._mongooseConnectionPromise) {
    global._mongooseConnectionPromise = mongoose.connect(uri);
  }

  return global._mongooseConnectionPromise;
}