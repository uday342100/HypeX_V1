from typing import List, Tuple, Dict

class UnionFind:
    """
    Standard Union-Find (Disjoint Set) implementation with path compression.
    Used to resolve transitive equivalence relationships:
    e.g., if A matches B, and B matches C, then A, B, and C form one cluster.
    """
    def __init__(self):
        self.parent = {}
        
    def find(self, i: int) -> int:
        if i not in self.parent:
            self.parent[i] = i
            return i
        
        # Iterative find with path compression
        path = []
        curr = i
        while self.parent[curr] != curr:
            path.append(curr)
            curr = self.parent[curr]
            
        for node in path:
            self.parent[node] = curr
            
        return curr
        
    def union(self, i: int, j: int) -> bool:
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            self.parent[root_i] = root_j
            return True
        return False
        
    def get_clusters(self) -> List[List[int]]:
        """Groups elements by their roots and returns a list of clusters."""
        clusters = {}
        for element in self.parent:
            root = self.find(element)
            if root not in clusters:
                clusters[root] = []
            clusters[root].append(element)
        return list(clusters.values())

def build_material_clusters(materials_list: List[int], approved_matches: List[Tuple[int, int]]) -> List[List[int]]:
    """
    Runs clustering algorithm on all active materials and their approved matching edges.
    Returns a list of integer lists, where each inner list represents a cluster of material IDs.
    """
    uf = UnionFind()
    
    # Initialize all materials as their own separate root
    for mat_id in materials_list:
        uf.find(mat_id)
        
    # Union approved matches
    for mat_a, mat_b in approved_matches:
        uf.union(mat_a, mat_b)
        
    return uf.get_clusters()
