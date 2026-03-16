import networkx as nx


def build_graph(triples: list[dict]) -> dict:
    """Build a NetworkX graph from triples and return a serializable dict."""
    G = nx.DiGraph()
    for triple in triples:
        G.add_node(triple["source"])
        G.add_node(triple["target"])
        G.add_edge(triple["source"], triple["target"], label=triple["relation"])

    nodes = [{"id": n, "label": n} for n in G.nodes()]
    edges = [
        {"from": u, "to": v, "label": data.get("label", "")}
        for u, v, data in G.edges(data=True)
    ]
    return {"nodes": nodes, "edges": edges}
