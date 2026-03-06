# Базовый образ Go
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY *.go ./

# Собираем статический бинарник
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Финальный образ
FROM alpine:latest

WORKDIR /root/

# Копируем бинарник из builder
COPY --from=builder /app/server .

# Команда запуска
CMD ["./server"]