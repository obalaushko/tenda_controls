FROM denoland/deno:latest

WORKDIR /app

COPY deno.json .

COPY . .

EXPOSE 3001

CMD ["task", "start"]
