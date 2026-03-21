import networkx as nx


def build_graph(triples: list[dict]) -> dict:
    """Build a NetworkX graph from triples and return a serializable dict."""
    G = nx.DiGraph()
    for triple in triples:
        # Check if keys exist in the triple (robustness)
        source = triple.get("source", "Unknown")
        target = triple.get("target", "Unknown")
        relation = triple.get("relation", "is related to")
        
        G.add_node(source)
        G.add_node(target)
        G.add_edge(source, target, label=relation)

    nodes = [{"id": n, "label": n} for n in G.nodes()]
    edges = [
        {"from": u, "to": v, "label": data.get("label", "")}
        for u, v, data in G.edges(data=True)
    ]
    return {"nodes": nodes, "edges": edges}
