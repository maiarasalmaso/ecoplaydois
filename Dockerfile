
# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Expose Vite default port
EXPOSE 5173

# Start development server exposed to host
CMD ["npm", "run", "dev:client", "--", "--host"]
