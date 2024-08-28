FROM denoland/deno:latest

WORKDIR /app

COPY . .

EXPOSE 3001

CMD ["task", "start"]
