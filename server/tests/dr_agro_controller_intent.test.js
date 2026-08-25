const drAgroController = require("../controllers/drAgroController");

async function runControllerIntentTest() {
  console.log("\n=======================================================");
  console.log("TEST: drAgroController Conversational Intent Guard");
  console.log("=======================================================\n");

  const testCases = [
    { query: "hii", expectedSnippet: "Hello! 👋 I’m Agro AI" },
    { query: "Hi", expectedSnippet: "Hello! 👋 I’m Agro AI" },
    { query: "HELLO", expectedSnippet: "Hello! 👋 I’m Agro AI" },
    { query: "namaskar", expectedSnippet: "Hello! 👋 I’m Agro AI" },
    { query: "good morning", expectedSnippet: "Hello! 👋 I’m Agro AI" },
    { query: "thanks", expectedSnippet: "You're welcome!" },
    { query: "bye", expectedSnippet: "Goodbye, Kisan!" },
  ];

  for (const tc of testCases) {
    let responseData = null;
    const req = { body: { message: tc.query } };
    const res = {
      json: (data) => {
        responseData = data;
        return res;
      },
      status: (code) => res,
    };

    await drAgroController.chatWithRAG(req, res);

    if (!responseData || !responseData.success) {
      throw new Error(`Controller failed on query "${tc.query}"`);
    }

    if (responseData.sources && responseData.sources.length > 0) {
      throw new Error(`FAIL: "${tc.query}" returned non-empty sources: ${JSON.stringify(responseData.sources)}`);
    }

    if (responseData.engine !== "Conversational Assistant") {
      throw new Error(`FAIL: "${tc.query}" returned engine "${responseData.engine}", expected "Conversational Assistant"`);
    }

    if (!responseData.answer.includes(tc.expectedSnippet)) {
      throw new Error(`FAIL: "${tc.query}" answer did not contain "${tc.expectedSnippet}". Answer: "${responseData.answer}"`);
    }

    console.log(`✓ Controller PASS for "${tc.query}": Bypassed RAG! Sources: []`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL CONTROLLER INTENT TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

runControllerIntentTest().catch((err) => {
  console.error("❌ TEST FAILED:", err.message);
  process.exit(1);
});
