import numpy as np
from typing import List

# Module variables for sentence-transformers
USE_SENTENCE_TRANSFORMERS = False
model = None

try:
    print("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
    from sentence_transformers import SentenceTransformer
    # Initialize the model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    USE_SENTENCE_TRANSFORMERS = True
    print("SentenceTransformer loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load SentenceTransformer ({e}). Using robust feature-hash embedding generator.")

def get_fallback_embedding(text: str, dimension: int = 384) -> List[float]:
    """
    Generates a deterministic 384-dimensional unit vector using word and character bigram hashing.
    Maintains similarity score scaling when calculating dot products.
    """
    if not text:
        return [0.0] * dimension
        
    vector = np.zeros(dimension, dtype=float)
    words = text.lower().split()
    
    # Feature hash words to index positions
    for word in words:
        h1 = hash(word) % dimension
        h2 = (hash(word + "_salt") ^ 0xabcdef) % dimension
        vector[h1] += 1.0
        vector[h2] += 0.5
        
    # Feature hash character bigrams for edit distance / spelling correction mapping
    chars = text.lower()
    for i in range(len(chars) - 1):
        bigram = chars[i:i+2]
        h = hash(bigram) % dimension
        vector[h] += 0.2
        
    # Unit normalization (L2 norm)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
        
    return vector.tolist()

def generate_embedding(text: str) -> List[float]:
    """
    Computes a 384-dimensional vector embedding.
    Attempts sentence-transformers first, and falls back to feature-hashing if not installed/configured.
    """
    if USE_SENTENCE_TRANSFORMERS and model is not None:
        try:
            emb = model.encode(text)
            return emb.tolist()
        except Exception as e:
            print(f"Embedding error: {e}. Falling back to hash vectorizer.")
            return get_fallback_embedding(text)
    else:
        return get_fallback_embedding(text)

def calculate_cosine_similarity(emb_a: List[float], emb_b: List[float]) -> float:
    """
    Calculates the cosine similarity between two unit vectors.
    """
    vec_a = np.array(emb_a)
    vec_b = np.array(emb_b)
    
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
        
    similarity = np.dot(vec_a, vec_b) / (norm_a * norm_b)
    return float(np.clip(similarity, 0.0, 1.0))
