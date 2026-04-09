# Base image
FROM node:20-alpine

# Tạo thư mục app
WORKDIR /app

# Copy package trước để cache tốt hơn
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ source
COPY . .

# Build nếu dùng TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Chạy app
CMD ["node", "dist/index.js"]