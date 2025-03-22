FROM python:3.10-slim

WORKDIR /app

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
