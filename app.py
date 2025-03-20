from flask import Flask, request, render_template, jsonify, send_from_directory
import os
import uuid
from rembg import remove
from PIL import Image
import io
import time

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['PROCESSED_FOLDER'] = 'static/processed'

# Create directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/remove-background', methods=['POST'])
def remove_background():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    # Generate unique filename
    filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    output_path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    
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
            bg_img = Image.open(bg_file)
            
            # Resize background to match foreground dimensions
            bg_img = bg_img.resize(output_img.size)
            
            # Create composite image
            bg_img.paste(output_img, (0, 0), output_img)
            bg_img.save(output_path)
        else:
            # Save image with transparent background
            output_img.save(output_path)
        
        return jsonify({
            'success': True,
            'filename': filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/static/processed/<filename>')
def processed_file(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

