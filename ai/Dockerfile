FROM python:3.9

WORKDIR /ai

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install flask


COPY app.py .

CMD ["python", "app.py"]
