import json
from src.rag_engine import rag_engine

print("\n=======================================================")
print("TEST: RAG Response Synthesis & Formatting Verification")
print("=======================================================\n")

# Test 1: Greeting
print("Running Test 1: Greeting ('hi' / 'hello')...")
for q in ["hi", "hello", "hii", "namaskar"]:
    res = rag_engine.ask(q)
    assert res["sources"] == [], f"Greeting '{q}' should have empty sources, got: {res['sources']}"
    assert "Hello! 👋 I’m Agro AI" in res["answer"], f"Unexpected greeting answer for '{q}': {res['answer']}"
    assert res["engine"] == "Conversational Assistant"
print("✓ Test 1 Passed: Greetings returned natural greeting without RAG retrieval or document dump.\n")

# Test 2: Agricultural Question (Wheat leaf yellowing)
print("Running Test 2: Wheat Leaf Yellowing ('What causes yellowing of wheat leaves?')...")
res2 = rag_engine.ask("What causes yellowing of wheat leaves?")
ans2 = res2["answer"]
assert len(ans2) > 50, "Answer too short!"
assert not ans2.startswith("## CHAPTER"), f"Raw chapter header found in answer! Answer:\n{ans2}"
assert "6 Signs of" not in ans2, f"Raw index noise found in answer! Answer:\n{ans2}"
assert "Nitrogen deficiency" in ans2 or "nitrogen" in ans2.lower()
assert "older or newer leaves" in ans2.lower()
assert len(res2["sources"]) > 0, "Agricultural query should return sources!"
print("✓ Test 2 Passed: Conversational synthesized answer for wheat leaf yellowing generated.")
print(f"   Answer:\n{ans2}\n")

# Test 3: Fertilizer Comparison (DAP vs Urea)
print("Running Test 3: DAP vs Urea ('What is the difference between DAP and Urea?')...")
res3 = rag_engine.ask("What is the difference between DAP and Urea?")
ans3 = res3["answer"]
assert "Urea" in ans3 and "DAP" in ans3
assert "46%" in ans3, "Missing 46% N technical value for Urea!"
assert "18-46-0" in ans3 or "18%" in ans3, "Missing 18-46-0 technical values for DAP!"
assert not ans3.startswith("##"), "Raw header found!"
assert len(res3["sources"]) > 0, "Fertilizer query should return sources!"
print("✓ Test 3 Passed: Natural comparative synthesis for DAP vs Urea returned with exact numeric facts.")
print(f"   Answer:\n{ans3}\n")

# Test 4: Soil Question (Acidic Soil Correction)
print("Running Test 4: Soil Question ('How can I correct acidic soil?')...")
res4 = rag_engine.ask("How can I correct acidic soil?")
ans4 = res4["answer"]
assert "acidic" in ans4.lower() or "lime" in ans4.lower() or "ph" in ans4.lower()
assert not ans4.startswith("## CHAPTER"), "Raw chapter header found!"
assert len(res4["sources"]) > 0, "Soil query should return sources!"
print("✓ Test 4 Passed: Acidic soil correction synthesized cleanly.\n")

# Test 5: Unsupported Question
print("Running Test 5: Unsupported Question ('What is the capital of France?')...")
res5 = rag_engine.ask("What is the capital of France?")
assert res5["sources"] == [], f"Non-agricultural query should have empty sources! Got: {res5['sources']}"
assert "couldn't find enough relevant information" in res5["answer"].lower() or "insufficient" in res5["answer"].lower()
print("✓ Test 5 Passed: Non-agricultural question safely rejected without hallucinating.\n")

print("=======================================================")
print("🎉 ALL 5 RAG SYNTHESIS VERIFICATION TESTS PASSED!")
print("=======================================================\n")
