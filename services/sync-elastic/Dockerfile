# Stage 1: Build Stage
FROM python:3.12-slim AS builder

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install Poetry
RUN pip install --upgrade pip && pip install poetry

# Set work directory
WORKDIR /app

# Copy dependency files and install dependencies
COPY poetry.lock pyproject.toml README.md /app/
RUN poetry config virtualenvs.create false && poetry lock && poetry install --only main --no-root

# Copy the application code
COPY app/ /app/

# Change ownership to the non-root user
RUN chown -R appuser:appuser /app

# Stage 2: Production Stage
FROM python:3.12-slim

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Copy the application from the builder stage
COPY --from=builder /usr/local usr/local
COPY --from=builder /app /app 

# Change ownership to the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose the application port
EXPOSE 5000

# Define the health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/healthz || exit 1

# Define the default command to run the application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "main:app", "--log-level", "debug"]
