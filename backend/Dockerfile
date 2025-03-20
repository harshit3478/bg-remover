FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for rembg
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Create directories for uploads and processed images
RUN mkdir -p uploads processed

# Set file permissions
RUN chmod -R 777 uploads processed

# Expose port
EXPOSE 5001

# Run the application with increased timeout
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--timeout", "300", "app:app"]
