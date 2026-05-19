import { Pool } from "pg";

let pool: any;
let database: string | undefined;

if (process.env.NODE_ENV == 'development') {
  database = process.env.DB_NAME_DEV;
} else if (process.env.NODE_ENV == 'test') {
  database = process.env.DB_NAME_TEST;
} else {
  database = process.env.PGDATABASE;
}

console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('current user: ', process.env.DB_USER);
console.log('current host: ', process.env.DB_HOST);
console.log('current database: ', database);
console.log('current password: ', process.env.DB_PASSWORD);
console.log('current port: ', process.env.DB_PORT);

try {
  if (process.env.NODE_ENV == 'development') {
    // development / docker
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: database,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    });
  } else if (process.env.NODE_ENV == 'test') {
    // test github actions
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: database,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    });
  } else {
    // production / railway
    pool = new Pool({
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: database,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
    });
  }
} catch (err) {
  console.error('Error loading database configuration:', err);
  process.exit(1); // Exit the application if there is a configuration error
}


export default pool;