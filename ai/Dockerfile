# Wykorzystaj oficjalny obraz Python jako podstawowy
FROM python:3.9

# Utwórz katalog roboczy w kontenerze
WORKDIR /app

# Skopiuj plik requirements.txt do katalogu roboczego
COPY requirements.txt .

# Zainstaluj zależności
RUN pip install --no-cache-dir -r requirements.txt

# Skopiuj kod aplikacji
COPY app.py .

# Uruchom serwer Flask
CMD ["python", "app.py"]
