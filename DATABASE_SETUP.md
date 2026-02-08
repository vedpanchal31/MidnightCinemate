# Database Setup Guide for Cinemate

## Current Issue
PostgreSQL is running on port 5432, but password authentication is failing for the `postgres` user.

## Solution Options

### Option 1: Use Your System User (Recommended for Development)

Since PostgreSQL is installed on Ubuntu, you can use peer authentication with your system user:

1. **Create a PostgreSQL user matching your system username:**
   ```bash
   sudo -u postgres createuser -s wappnet-07
   ```

2. **Create the database:**
   ```bash
   createdb cinemate
   ```

3. **Apply the schema:**
   ```bash
   psql -d cinemate -f schema.sql
   ```

4. **Update your `.env` file:**
   ```env
   DB_USER=wappnet-07
   DB_PASSWORD=
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=cinemate
   DATABASE_URL=postgresql://wappnet-07@localhost:5432/cinemate
   ```

### Option 2: Set Password for postgres User

1. **Access PostgreSQL as the postgres user:**
   ```bash
   sudo -u postgres psql
   ```

2. **Set a password for the postgres user:**
   ```sql
   ALTER USER postgres WITH PASSWORD 'your_secure_password';
   ```

3. **Exit psql:**
   ```sql
   \q
   ```

4. **Create the database:**
   ```bash
   sudo -u postgres createdb cinemate
   ```

5. **Apply the schema:**
   ```bash
   sudo -u postgres psql -d cinemate -f schema.sql
   ```

6. **Update your `.env` file with the password you set:**
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=cinemate
   DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/cinemate
   ```

### Option 3: Use Adminer (Web Interface)

Since you mentioned Adminer, you can:

1. **Access Adminer** at the URL you're using
2. **Login with:**
   - System: PostgreSQL
   - Server: localhost:5432
   - Username: wappnet-07 (or postgres if you set a password)
   - Password: (leave empty for peer auth, or use the password you set)
   - Database: postgres (initially)

3. **Create the database** through Adminer's interface
4. **Import the schema** using Adminer's SQL command interface

## Quick Setup Script

After choosing your authentication method, run:

```bash
# For Option 1 (system user):
npm run setup-db

# Or manually:
npx tsx scripts/setup-db.ts
```

## Verify Connection

Test your database connection:

```bash
# For system user (Option 1):
psql -d cinemate -c "SELECT version();"

# For postgres user with password (Option 2):
PGPASSWORD=your_password psql -U postgres -d cinemate -c "SELECT version();"
```

## Troubleshooting

### Check if PostgreSQL is running:
```bash
sudo systemctl status postgresql
```

### Check PostgreSQL configuration:
```bash
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v "^#" | grep -v "^$"
```

### Restart PostgreSQL if needed:
```bash
sudo systemctl restart postgresql
```
