# Use the official Python image
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Copy only the necessary files for installing dependencies
COPY poetry.lock pyproject.toml README.md /app/

# Install Poetry
RUN pip install poetry

# Install dependencies
RUN poetry config virtualenvs.create false && poetry lock && poetry install --only main --no-root

# Copy the rest of the application code
COPY app/ /app/

# Run the application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "main:app", "--log-level", "debug"]