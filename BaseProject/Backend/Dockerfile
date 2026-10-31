FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8585

ENV FLASK_HOST=0.0.0.0
ENV FLASK_PORT=8585
ENV FLASK_DEBUG=false
ENV PYTHONUNBUFFERED=1

CMD ["python", "agents_server.py"]
