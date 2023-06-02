# Use an official PostgreSQL as the base image
FROM postgres:latest

# Set environment variables
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgrespw
ENV POSTGRES_DB=mydatabase

# Copy initialization script to the container
COPY init-scripts/init.sql /docker-entrypoint-initdb.d/
