version: '3.8'

services:
  navisafe:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: navisafe-app
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    networks:
      - navisafe-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  navisafe-network:
    driver: bridge
