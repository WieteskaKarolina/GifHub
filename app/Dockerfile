# Wykorzystaj oficjalny obraz Node.js jako podstawowy
FROM node:14

# Utwórz katalog roboczy w kontenerze
WORKDIR /app

# Skopiuj pliki package.json i package-lock.json do katalogu roboczego
COPY package*.json ./

# Zainstaluj zależności
RUN npm install
RUN npm i isomorphic-fetch

# Skopiuj resztę plików aplikacji
COPY . .

# Uruchom serwer
CMD [ "node", "app.js" ]
