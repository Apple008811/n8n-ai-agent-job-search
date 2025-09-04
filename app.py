#!/usr/bin/env python3
from flask import Flask, request, jsonify
import logging
import re
import os
from datetime import datetime
import PyPDF2
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "AI Content Analyzer API", "version": "2.0.0"})

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        content = data.get("content", "")
        content_type = data.get("content_type", "text")
        
        logger.info(f"Received analysis request: content_type={content_type}")
        
        # Basic analysis
        words = content.split()
        characters = len(content)
        sentences = len(re.split(r'[。！？.!?]', content))
        
        result = {
            "analysis_type": f"{content_type}_analysis",
            "content_length": {
                "characters": characters, 
                "words": len(words),
                "sentences": sentences
            },
            "key_information": {
                "sentiment": analyze_sentiment(content),
                "title": content[:50] + "..." if len(content) > 50 else content,
                "keywords": extract_keywords(content)
            },
            "raw_content_preview": content[:100] + "..." if len(content) > 100 else content,
            "source": content_type,
            "success": True,
            "summary": f"Successfully analyzed {content_type} content, {len(words)} words, {sentences} sentences",
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Analysis request failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/analyze_pdf", methods=["POST"])
def analyze_pdf():
    """Handle PDF file analysis"""
    try:
        # Check if file is uploaded
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"success": False, "error": "Only PDF files are supported"}), 400
        
        logger.info(f"Received PDF analysis request: {file.filename}")
        
        # Extract PDF content
        pdf_content = extract_pdf_text(file)
        
        if not pdf_content.strip():
            return jsonify({"success": False, "error": "PDF file is empty or cannot be read"}), 400
        
        # Analyze PDF content
        result = analyze_pdf_content(pdf_content, file.filename)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"PDF analysis failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

def extract_pdf_text(file):
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text() + "\n"
        
        return text
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        raise e

def analyze_pdf_content(content, filename):
    """Analyze PDF content"""
    # Basic analysis
    words = content.split()
    characters = len(content)
    sentences = len(re.split(r'[。！？.!?]', content))
    paragraphs = len([p for p in content.split('\n\n') if p.strip()])
    
    # Extract PDF specific information
    pdf_info = extract_pdf_info(content)
    
    result = {
        "analysis_type": "pdf_analysis",
        "filename": filename,
        "content_length": {
            "characters": characters, 
            "words": len(words),
            "sentences": sentences,
            "paragraphs": paragraphs
        },
        "key_information": {
            "title": extract_title(content),
            "keywords": extract_keywords(content),
            "main_topics": extract_topics(content),
            "summary": generate_summary(content),
            "pdf_metadata": pdf_info
        },
        "raw_content_preview": content[:200] + "..." if len(content) > 200 else content,
        "source": "pdf",
        "success": True,
        "summary": f"Successfully analyzed PDF file, {len(words)} words, {sentences} sentences, {paragraphs} paragraphs",
        "timestamp": datetime.now().isoformat()
    }
    
    return result

def extract_pdf_info(content):
    """Extract PDF document information"""
    info = {
        "document_type": "pdf",
        "estimated_pages": estimate_pages(content),
        "has_tables": "table" in content.lower() or "chart" in content.lower(),
        "has_numbers": bool(re.search(r'\d+', content)),
        "language": detect_language(content)
    }
    return info

def extract_title(content):
    """Extract document title"""
    lines = content.split('\n')
    for line in lines[:10]:  # Check first 10 lines
        line = line.strip()
        if line and len(line) > 5 and len(line) < 100:
            # Simple title detection logic
            if not line.isdigit() and not line.startswith('Chapter'):
                return line
    return "Title not found"

def extract_topics(content):
    """Extract main topics"""
    # Simple topic extraction
    topics = []
    crypto_keywords = ['crypto', 'bitcoin', 'blockchain', 'token', 'defi', 'nft', 'cryptocurrency']
    legal_keywords = ['law', 'regulation', 'legal', 'act', 'bill', 'legislation', 'compliance']
    
    crypto_count = sum(1 for keyword in crypto_keywords if keyword.lower() in content.lower())
    legal_count = sum(1 for keyword in legal_keywords if keyword.lower() in content.lower())
    
    if crypto_count > 0:
        topics.append("Cryptocurrency")
    if legal_count > 0:
        topics.append("Legal Regulation")
    
    return topics if topics else ["Document Analysis"]

def generate_summary(content):
    """Generate document summary"""
    sentences = re.split(r'[。！？.!?]', content)
    if len(sentences) <= 3:
        return content
    
    # Simple summary: take first 3 sentences
    summary = '. '.join(sentences[:3]) + '.'
    return summary

def estimate_pages(content):
    """Estimate number of pages"""
    # Simple estimation: ~500 words per page
    word_count = len(content.split())
    return max(1, word_count // 500)

def detect_language(content):
    """Detect language"""
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', content))
    english_chars = len(re.findall(r'[a-zA-Z]', content))
    
    if chinese_chars > english_chars:
        return "Chinese"
    elif english_chars > chinese_chars:
        return "English"
    else:
        return "Mixed"

def analyze_sentiment(text):
    """Simple sentiment analysis"""
    positive_words = ['good', 'great', 'excellent', 'like', 'satisfied', 'happy', 'success', 'perfect', 'awesome']
    negative_words = ['bad', 'terrible', 'hate', 'disappointed', 'sad', 'pain', 'failure', 'problem', 'error']
    
    positive_count = sum(1 for word in positive_words if word.lower() in text.lower())
    negative_count = sum(1 for word in negative_words if word.lower() in text.lower())
    
    if positive_count > negative_count:
        return "positive"
    elif negative_count > positive_count:
        return "negative"
    else:
        return "neutral"

def extract_keywords(text):
    """Extract keywords"""
    words = re.findall(r'\w+', text.lower())
    word_freq = {}
    for word in words:
        if len(word) > 1:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort and return top 5 keywords
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, freq in sorted_words[:5]]

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "AI Content Analyzer API",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health", 
            "analyze": "/analyze",
            "analyze_pdf": "/analyze_pdf"
        }
    })

if __name__ == "__main__":
    logger.info("Starting AI Analysis API service...")
    app.run(host="0.0.0.0", port=5000, debug=True)
