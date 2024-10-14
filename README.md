# Installation

## Prerequisites
1. **Node** (>=v20.15.0)
2. **Docker**
3. **Docker Compose**

## Steps

### 1. Set the environment variables
Configure the required environment variables for the application. You can add them to your `.env` file or export them directly in your environment.
```sh
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_DATABASE=summarizer

REDIS_CONNECTION=local
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

OPENAI_API_KEY="<YOUR OPENAI API KEY>"
```

### 2. Start Docker Containers
Run the following command to start your Docker containers in detached mode:
```sh
docker compose up -d
```

### 3. Create the Database
Create a PostgreSQL database named `summarizer`.

### 4. Run the Database Migration
Execute the migrations to set up your database schema:
```sh
node ace migration:run
```

### 5. Run the Development Server
Finally, start the development server:
```sh
npm run dev
```


