import asyncio
import sys
sys.path.insert(0, "D:/HypeX/HypeX_V1/ml-service")

from app.services.embedding_service import embedding_service


async def test_qwen_embeddings():
    texts = [
        "SS Pipe 25mm",
        "Stainless Steel Pipe, 25 MM diameter",
        "Mild Steel Bolt M16 x 50",
    ]

    print("\nTesting Qwen embeddings via llama.cpp...")
    embeddings = await embedding_service.generate_embeddings(texts)

    print("\nEmbedding test successful!\n")
    for i, text in enumerate(texts):
        print(f"{i}: {text}")
        print(f"   Dimensions: {len(embeddings[i])}")

    def cosine_similarity(a, b):
        import numpy as np
        a = np.array(a)
        b = np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

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

    health = await embedding_service.health_check()
    print(f"\nHealth check: {health}")


if __name__ == "__main__":
    asyncio.run(test_qwen_embeddings())