FROM node:22-slim

RUN corepack enable
RUN corepack prepare pnpm@9.7.0 --activate

COPY ./dist ./app/dist
COPY ./public ./app/public
COPY ./src ./app/src
COPY ./astro.config.mjs ./app/astro.config.mjs
COPY ./package.json ./app/package.json
COPY ./tsconfig.json ./app/tsconfig.json

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

WORKDIR /app

RUN pnpm install

CMD ["pnpm", "dev"]
