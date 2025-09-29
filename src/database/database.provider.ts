import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

export const DatabaseProviders = [
  {
    provide: 'MONGO_CLIENT',
    useFactory: async () => {
      const client = new MongoClient(
        process.env.MONGO_URI ||
          'mongodb+srv://<user>:<pass>@cluster0.mongodb.net/mydb?retryWrites=true&w=majority',
      );

      await client.connect();

      return client.db();
    },
  },
];
