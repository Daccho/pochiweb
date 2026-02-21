# Frontend build
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Backend build
FROM golang:1.22-alpine AS backend
WORKDIR /app
COPY server/ ./
RUN go mod init pochiweb-server && go mod tidy
RUN go build -o server main.go

# Final stage
FROM alpine:latest
WORKDIR /app
COPY --from=backend /app/server .
COPY --from=frontend /app/dist ./dist
COPY .env .

EXPOSE 8080
CMD ["./server"]
