FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter @sepe/web build

FROM base
COPY --from=build /usr/src/app /usr/src/app
WORKDIR /usr/src/app/apps/web
EXPOSE 3000
CMD [ "pnpm", "start" ]
