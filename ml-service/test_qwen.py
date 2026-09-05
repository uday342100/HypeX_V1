import requests
import numpy as np

URL = "http://127.0.0.1:8080/v1/embeddings"

texts = [
    "SS Pipe 25mm",
    "Stainless Steel Pipe, 25 MM diameter",
    "Mild Steel Bolt M16 x 50",
]


def get_embeddings(texts):
    response = requests.post(
        URL,
        json={
            "model": "Qwen3-Embedding-4B",
            "input": texts,
        },
        timeout=120,
    )

    response.raise_for_status()
    data = response.json()["data"]

    # Sort by index so input order stays correct
    data.sort(key=lambda x: x["index"])

    return [np.array(item["embedding"], dtype=np.float32) for item in data]


def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


embeddings = get_embeddings(texts)

print("\nEmbedding test successful!\n")

for i, text in enumerate(texts):
    print(f"{i}: {text}")
    print(f"   Dimensions: {len(embeddings[i])}")

print("\n--- Similarities ---")

pairs = [
    (0, 1),  # Pipe vs Pipe
    (0, 2),  # Pipe vs Bolt
]

for i, j in pairs:
    score = cosine_similarity(embeddings[i], embeddings[j])

    print(f"\n{texts[i]}")
    print(f"VS")
    print(f"{texts[j]}")
    print(f"Similarity: {score:.4f}")