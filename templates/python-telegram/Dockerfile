FROM python:3.12-slim AS runner

# Create unprivileged application user
RUN groupadd -g 1001 zeubot && \
    useradd -u 1001 -g zeubot -m -d /app zeubot

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

RUN chown -R zeubot:zeubot /app

USER 1001:1001
ENV PYTHONUNBUFFERED=1

CMD ["python", "src/main.py"]
