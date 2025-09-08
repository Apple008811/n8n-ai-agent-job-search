#!/usr/bin/env python3
"""
LLM + RAG Service for Job Collection Platform
Integrates GPT API with vector database for intelligent job recommendations
"""

from flask import Flask, request, jsonify
import openai
import numpy as np
from sentence_transformers import SentenceTransformer
import sqlite3
import json
import logging
from datetime import datetime
import os
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
MODEL_NAME = "gpt-4o-mini"  # Cost-effective model
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Lightweight embedding model

# Initialize models
openai.api_key = OPENAI_API_KEY
embedding_model = SentenceTransformer(EMBEDDING_MODEL)

# Vector database (SQLite with vector extensions)
VECTOR_DB_PATH = "job_vectors.db"

class JobRAGSystem:
    def __init__(self):
        self.init_vector_db()
    
    def init_vector_db(self):
        """Initialize vector database for job embeddings"""
        conn = sqlite3.connect(VECTOR_DB_PATH)
        cursor = conn.cursor()
        
        # Create jobs table with vector storage
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_title TEXT NOT NULL,
                company TEXT,
                location TEXT,
                work_type TEXT,
                salary TEXT,
                job_link TEXT,
                description TEXT,
                requirements TEXT,
                embedding BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create chat history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                message TEXT,
                response TEXT,
                context_jobs TEXT,  -- JSON array of relevant job IDs
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_job_to_vector_db(self, job_data: Dict[str, Any]) -> int:
        """Add job to vector database with embedding"""
        # Create job description for embedding
        job_text = f"""
        Job Title: {job_data.get('jobTitle', '')}
        Company: {job_data.get('company', '')}
        Location: {job_data.get('location', '')}
        Work Type: {job_data.get('workType', '')}
        Salary: {job_data.get('salary', '')}
        Description: {job_data.get('description', '')}
        Requirements: {job_data.get('requirements', '')}
        """
        
        # Generate embedding
        embedding = embedding_model.encode(job_text)
        
        # Store in database
        conn = sqlite3.connect(VECTOR_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO jobs (job_title, company, location, work_type, salary, 
                            job_link, description, requirements, embedding)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            job_data.get('jobTitle', ''),
            job_data.get('company', ''),
            job_data.get('location', ''),
            job_data.get('workType', ''),
            job_data.get('salary', ''),
            job_data.get('jobLink', ''),
            job_data.get('description', ''),
            job_data.get('requirements', ''),
            embedding.tobytes()
        ))
        
        job_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return job_id
    
    def search_similar_jobs(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar jobs using vector similarity"""
        # Generate query embedding
        query_embedding = embedding_model.encode(query)
        
        # Search in database
        conn = sqlite3.connect(VECTOR_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, job_title, company, location, work_type, salary, job_link, description, requirements, embedding FROM jobs')
        jobs = cursor.fetchall()
        conn.close()
        
        # Calculate similarities
        similarities = []
        for job in jobs:
            job_id, job_title, company, location, work_type, salary, job_link, description, requirements, embedding_bytes = job
            
            # Convert bytes back to numpy array
            job_embedding = np.frombuffer(embedding_bytes, dtype=np.float32)
            
            # Calculate cosine similarity
            similarity = np.dot(query_embedding, job_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(job_embedding)
            )
            
            similarities.append({
                'id': job_id,
                'job_title': job_title,
                'company': company,
                'location': location,
                'work_type': work_type,
                'salary': salary,
                'job_link': job_link,
                'description': description,
                'requirements': requirements,
                'similarity': float(similarity)
            })
        
        # Sort by similarity and return top results
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:limit]
    
    def generate_llm_response(self, user_message: str, context_jobs: List[Dict[str, Any]]) -> str:
        """Generate LLM response with job context"""
        
        # Prepare context from relevant jobs
        context_text = ""
        if context_jobs:
            context_text = "Relevant job opportunities:\n"
            for i, job in enumerate(context_jobs, 1):
                context_text += f"""
                {i}. {job['job_title']} at {job['company']}
                   Location: {job['location']}
                   Work Type: {job['work_type']}
                   Salary: {job['salary']}
                   Link: {job['job_link']}
                   Description: {job['description'][:200]}...
                """
        
        # Create system prompt
        system_prompt = """You are an intelligent job search assistant. You help users find relevant job opportunities and provide career advice based on the job database. 

Your responses should be:
- Helpful and informative
- Based on the provided job context
- Professional and encouraging
- Include specific job recommendations when relevant

Always provide actionable advice and mention specific job opportunities when they match the user's query."""

        # Prepare messages for GPT
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context: {context_text}\n\nUser Question: {user_message}"}
        ]
        
        try:
            response = openai.ChatCompletion.create(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"LLM API error: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again later."

# Initialize RAG system
rag_system = JobRAGSystem()

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy", 
        "service": "LLM + RAG Job Assistant", 
        "version": "1.0.0",
        "features": ["GPT Integration", "Vector Search", "Job Recommendations"]
    })

@app.route("/chat", methods=["POST"])
def chat():
    """Main chat endpoint for LLM + RAG interaction"""
    try:
        data = request.get_json()
        user_message = data.get("message", "")
        user_id = data.get("user_id", "default")
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Search for relevant jobs
        relevant_jobs = rag_system.search_similar_jobs(user_message, limit=3)
        
        # Generate LLM response
        llm_response = rag_system.generate_llm_response(user_message, relevant_jobs)
        
        # Store chat history
        conn = sqlite3.connect(VECTOR_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO chat_history (user_id, message, response, context_jobs)
            VALUES (?, ?, ?, ?)
        ''', (user_id, user_message, llm_response, json.dumps([job['id'] for job in relevant_jobs])))
        conn.commit()
        conn.close()
        
        return jsonify({
            "response": llm_response,
            "relevant_jobs": relevant_jobs,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/add_job", methods=["POST"])
def add_job():
    """Add job to vector database"""
    try:
        job_data = request.get_json()
        job_id = rag_system.add_job_to_vector_db(job_data)
        
        return jsonify({
            "success": True,
            "job_id": job_id,
            "message": "Job added to vector database"
        })
        
    except Exception as e:
        logger.error(f"Add job error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/search_jobs", methods=["POST"])
def search_jobs():
    """Search jobs by query"""
    try:
        data = request.get_json()
        query = data.get("query", "")
        limit = data.get("limit", 5)
        
        relevant_jobs = rag_system.search_similar_jobs(query, limit)
        
        return jsonify({
            "jobs": relevant_jobs,
            "query": query,
            "count": len(relevant_jobs)
        })
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/chat_history/<user_id>", methods=["GET"])
def get_chat_history(user_id):
    """Get chat history for user"""
    try:
        conn = sqlite3.connect(VECTOR_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT message, response, created_at FROM chat_history 
            WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
        ''', (user_id,))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "message": row[0],
                "response": row[1],
                "timestamp": row[2]
            })
        
        conn.close()
        
        return jsonify({"chat_history": history})
        
    except Exception as e:
        logger.error(f"Chat history error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
