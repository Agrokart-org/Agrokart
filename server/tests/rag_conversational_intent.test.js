const http = require("http");

function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: "localhost",
      port: 5001,
      path: urlPath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function runConversationalIntentTests() {
  console.log("\n=======================================================");
  console.log("TEST: Agro AI Conversational Intent Guard & RAG Bypass");
  console.log("=======================================================\n");

  const conversationalCases = [
    { query: "hii", expectedEngine: "Conversational Assistant" },
    { query: "Hi", expectedEngine: "Conversational Assistant" },
    { query: "HELLO", expectedEngine: "Conversational Assistant" },
    { query: "namaskar", expectedEngine: "Conversational Assistant" },
    { query: "good morning", expectedEngine: "Conversational Assistant" },
    { query: "thanks", expectedEngine: "Conversational Assistant" },
    { query: "bye", expectedEngine: "Conversational Assistant" },
  ];

  for (const c of conversationalCases) {
    console.log(`Testing Conversational Input: "${c.query}"...`);
    const res = await postJson("/api/dr-agro/chat", { message: c.query });
    
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 for "${c.query}", got ${res.status}`);
    }

    const { answer, sources, engine } = res.body;

    if (sources && sources.length > 0) {
      throw new Error(`FAIL: "${c.query}" returned sources [${sources.join(", ")}]. Should have empty sources!`);
    }

    if (engine !== c.expectedEngine) {
      throw new Error(`FAIL: Expected engine "${c.expectedEngine}", got "${engine}"`);
    }

    if (!answer || (!answer.includes("Namaskar, Kisan!") && !answer.includes("welcome") && !answer.includes("Goodbye") && !answer.includes("Great!"))) {
      throw new Error(`FAIL: "${c.query}" returned unexpected answer: "${answer}"`);
    }

    console.log(`✓ PASS: "${c.query}" → RAG bypassed. Response: "${answer.split("\n")[0]}" | Sources: []`);
  }

  console.log("\nTesting Genuine Agricultural Questions...");

  const agriculturalCases = [
    "What is DAP?",
    "How much nitrogen does urea contain?",
    "Why are my wheat leaves yellow?",
  ];

  for (const query of agriculturalCases) {
    console.log(`Testing Agricultural Input: "${query}"...`);
    const res = await postJson("/api/dr-agro/chat", { message: query });

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 for "${query}", got ${res.status}`);
    }

    const { answer, sources, engine } = res.body;

    if (engine === "Conversational Assistant") {
      throw new Error(`FAIL: Agricultural query "${query}" was incorrectly treated as a greeting!`);
    }

    console.log(`✓ PASS: "${query}" → Routed through RAG (${engine}). Sources count: ${sources?.length || 0}`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL CONVERSATIONAL INTENT TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

runConversationalIntentTests().catch((err) => {
  console.error("❌ TEST FAILED:", err.message);
  process.exit(1);
});
