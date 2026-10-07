# MySQL Database Management

CIVICA uses **MySQL** as its relational database.

## 1. Database Credentials & Configuration

* **Host**: `localhost`
* **Port**: `3306`
* **Database Name**: `Civica`
* **Username**: `root`
* **Password**: `root123`
* **Connection URL**: `jdbc:mysql://localhost:3306/Civica?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`

## 2. Automatic Table Creation

Spring Boot uses Hibernate with `ddl-auto: update`, which automatically creates and updates all required tables (`users`, `reports`, `resolutions`, `report_upvotes`, `report_bounding_boxes`) upon backend startup.

## 3. Pre-Seeded Default Accounts

On first run with an empty database, [DataSeeder.java](spring-backend/src/main/java/com/civica/util/DataSeeder.java) automatically inserts:

| Role | Email | Password |
|------|-------|----------|
| Citizen | `citizen@civica.dev` | `password123` |
| Authority | `authority@civica.dev` | `password123` |
| Admin | `admin@civica.dev` | `password123` |
