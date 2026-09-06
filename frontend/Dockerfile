# ----------------------------------------------------------------------
# Etapa 1: compilación del frontend con Vite
# ----------------------------------------------------------------------
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Vite incrusta las variables VITE_* en tiempo de COMPILACIÓN,
# por eso se reciben como argumentos de build y no como variables
# de entorno del contenedor.
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_BASE=/clapino/api

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE=$VITE_API_BASE

COPY . .
RUN npm run build

# ----------------------------------------------------------------------
# Etapa 2: servidor nginx que publica el resultado bajo /clapino
# ----------------------------------------------------------------------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html/clapino
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
