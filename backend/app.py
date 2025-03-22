from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import time
import threading
from rembg import remove
from PIL import Image
import io
import datetime
import shutil

app = Flask(__name__)
# Configure CORS to accept requests from all origins, specifically allowing the frontend origin
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['PROCESSED_FOLDER'] = 'processed'
# Set file retention time in seconds (e.g., 1 hour)
app.config['FILE_RETENTION_TIME'] = 3600

# Create directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)

def cleanup_files():
    """Clean up files older than FILE_RETENTION_TIME seconds."""
    while True:
        try:
            current_time = time.time()
            retention_time = app.config['FILE_RETENTION_TIME']
            
            # Clean up upload directory
            for filename in os.listdir(app.config['UPLOAD_FOLDER']):
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if os.path.isfile(file_path):
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > retention_time:
                        os.remove(file_path)
                        print(f"Removed old upload: {filename}")
            
            # Clean up processed directory
            for filename in os.listdir(app.config['PROCESSED_FOLDER']):
                file_path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
                if os.path.isfile(file_path):
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > retention_time:
                        os.remove(file_path)
                        print(f"Removed old processed file: {filename}")
        
        except Exception as e:
            print(f"Error in cleanup thread: {str(e)}")
        
        # Sleep for a period before checking again (e.g., 15 minutes)
        time.sleep(900)

# Start the cleanup thread when the application starts
cleanup_thread = threading.Thread(target=cleanup_files)
cleanup_thread.daemon = True  # Thread will exit when the main program exits
cleanup_thread.start()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

@app.route('/api/remove-background', methods=['POST'])
def remove_background():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    print('request.files', request.files)
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    # Generate unique filename with PNG extension to support transparency
    original_ext = os.path.splitext(file.filename)[1].lower()
    # Always use PNG for output to support transparency
    output_filename = str(uuid.uuid4()) + ".png"
    # Keep original extension for input file
    input_filename = str(uuid.uuid4()) + original_ext
    
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], input_filename)
    output_path = os.path.join(app.config['PROCESSED_FOLDER'], output_filename)
    
    # Save original image
    file.save(input_path)
    
    try:
        # Process image with rembg
        with open(input_path, 'rb') as f:
            img_data = f.read()
        
        
        # Remove background
        output_data = remove(img_data)
        output_img = Image.open(io.BytesIO(output_data))
        
        # Check if background image was provided
        if 'background' in request.files and request.files['background'].filename != '':
            bg_file = request.files['background']
            bg_img = Image.open(bg_file).convert("RGBA")
            
            # Resize background to match foreground dimensions
            bg_img = bg_img.resize(output_img.size)
            
            # Create composite image
            bg_img.paste(output_img, (0, 0), output_img)
            bg_img.save(output_path, format="PNG")
        else:
            # Save image with transparent background as PNG
            output_img.save(output_path, format="PNG")
        
        return jsonify({
            'success': True,
            'filename': output_filename,
            'original_filename': input_filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/processed/<filename>', methods=['GET'])
def processed_file(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)

@app.route('/api/original/<filename>', methods=['GET'])
def original_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

