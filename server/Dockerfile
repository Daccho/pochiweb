# Use Go image to build the server
FROM golang:1.22-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and context
COPY main.go .
COPY context/ ./context/

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -v -o server

# Use a minimal alpine image for the final container
FROM alpine:latest
WORKDIR /root/

# Copy the binary and context from builder
COPY --from=builder /app/server .
COPY --from=builder /app/context ./context

# Run on container startup
CMD ["./server"]
