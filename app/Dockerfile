# Wykorzystaj oficjalny obraz Node.js jako podstawowy
FROM node:14

# Utwórz katalog roboczy w kontenerze
WORKDIR /usr/src/backend

# Skopiuj pliki package.json i package-lock.json do katalogu roboczego
COPY package*.json ./

# Zainstaluj zależności
RUN npm install

# Skopiuj resztę plików aplikacji
COPY . .

# Wystaw port, na którym działa serwer
EXPOSE 3000

# Uruchom serwer
CMD [ "node", "app.js" ]
