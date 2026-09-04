from src.rag_engine import rag_engine

print("\n--- Testing Python Intent Classification ---")
test_cases = ["hii", "Hi", "HELLO", "namaskar", "good morning", "thanks", "bye"]
for q in test_cases:
    res = rag_engine.classify_conversational_intent(q)
    assert res is not None, f"Failed on {q}"
    assert res["sources"] == [], f"Sources not empty on {q}"
    print(f"✓ {q} -> Bypassed RAG! Answer: {res['answer'].splitlines()[0]}")

ask_res = rag_engine.ask("hii")
assert ask_res["sources"] == [], "ask() returned sources for greeting!"
assert ask_res["engine"] == "Conversational Assistant", "ask() wrong engine"
print("✓ rag_engine.ask('hii') -> Bypassed RAG completely!")

ag_res = rag_engine.ask("What is DAP?")
assert ag_res["engine"] != "Conversational Assistant", "Agricultural query wrongly intercepted!"
print("✓ rag_engine.ask('What is DAP?') -> Routed to RAG pipeline!")

print("\n🎉 ALL PYTHON INTENT TESTS PASSED!\n")
