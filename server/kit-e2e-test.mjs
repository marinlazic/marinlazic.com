/**
 * End-to-end test for Kit integration
 * Tests: email capture -> assessment completion -> application submission
 * Run: node server/kit-e2e-test.mjs
 */

const KIT_API_KEY = process.env.KIT_API_KEY || "kit_6205aa37bc736c60af9dba72f031cc03";
const BASE_URL = "https://api.kit.com/v4";
const TEST_EMAIL = `manus.test.${Date.now()}@marinlazic.com`;

const headers = {
  "Content-Type": "application/json",
  "X-Kit-Api-Key": KIT_API_KEY,
};

async function kitGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  return res.json();
}

async function kitPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log("=== Kit E2E Test ===");
  console.log("Test email:", TEST_EMAIL);
  console.log("");

  // Step 1: Simulate email capture (create subscriber + tag assessment-started)
  console.log("1. Creating subscriber (simulating email capture)...");
  const { status: subStatus, data: subData } = await kitPost("/subscribers", {
    email_address: TEST_EMAIL,
    first_name: "ManusTest",
  });
  console.log("   Status:", subStatus);
  console.log("   Subscriber ID:", subData?.subscriber?.id);
  
  if (!subData?.subscriber?.id) {
    console.error("   FAILED: Could not create subscriber");
    console.error("   Response:", JSON.stringify(subData, null, 2));
    process.exit(1);
  }
  const subscriberId = subData.subscriber.id;

  // Find or create assessment-started tag
  console.log("\n   Looking up 'assessment-started' tag...");
  const tagsRes = await kitGet("/tags?per_page=100");
  let assessmentStartedTag = tagsRes.tags?.find(t => t.name === "assessment-started");
  
  if (!assessmentStartedTag) {
    console.log("   Creating 'assessment-started' tag...");
    const { data: tagData } = await kitPost("/tags", { name: "assessment-started" });
    assessmentStartedTag = tagData.tag;
  }
  console.log("   Tag ID:", assessmentStartedTag?.id);

  // Tag subscriber
  console.log("   Tagging subscriber with 'assessment-started'...");
  const { status: tagStatus } = await kitPost(`/tags/${assessmentStartedTag.id}/subscribers`, {
    email_address: TEST_EMAIL,
  });
  console.log("   Tag status:", tagStatus);

  await sleep(1000);

  // Step 2: Simulate assessment completion (tag + custom fields)
  console.log("\n2. Simulating assessment completion...");
  
  // Find assessment-completed tag
  const completedTag = tagsRes.tags?.find(t => t.name === "assessment-completed");
  if (!completedTag) {
    console.error("   FAILED: 'assessment-completed' tag not found in Kit");
    process.exit(1);
  }
  console.log("   'assessment-completed' tag ID:", completedTag.id);

  // Tag subscriber with assessment-completed
  const { status: compTagStatus } = await kitPost(`/tags/${completedTag.id}/subscribers`, {
    email_address: TEST_EMAIL,
  });
  console.log("   Tagged with assessment-completed, status:", compTagStatus);

  // Create/find custom fields and update subscriber
  const customFields = {
    score: "72",
    weakest_area: "sleep",
    strongest_area: "training",
    primary_goal: "Build muscle and improve recovery",
    role: "Executive",
    commitment_level: "4-5 days per week",
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "eaa-carousel",
  };

  console.log("   Setting custom fields...");
  
  // Get existing custom fields
  const fieldsRes = await kitGet("/custom_fields");
  const existingFields = fieldsRes.custom_fields || [];
  
  // Create missing fields
  for (const key of Object.keys(customFields)) {
    const exists = existingFields.find(f => f.label === key);
    if (!exists) {
      console.log(`   Creating custom field: ${key}`);
      await kitPost("/custom_fields", { label: key });
      await sleep(300);
    }
  }

  // Update subscriber with custom fields
  const updateRes = await fetch(`${BASE_URL}/subscribers/${subscriberId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ fields: customFields }),
  });
  const updateData = await updateRes.json();
  console.log("   Custom fields update status:", updateRes.status);

  await sleep(1000);

  // Step 3: Simulate application submission (tag application-submitted)
  console.log("\n3. Simulating application submission...");
  
  const appTag = tagsRes.tags?.find(t => t.name === "application-submitted");
  if (!appTag) {
    console.error("   FAILED: 'application-submitted' tag not found in Kit");
    process.exit(1);
  }
  console.log("   'application-submitted' tag ID:", appTag.id);

  const { status: appTagStatus } = await kitPost(`/tags/${appTag.id}/subscribers`, {
    email_address: TEST_EMAIL,
  });
  console.log("   Tagged with application-submitted, status:", appTagStatus);

  await sleep(1000);

  // Step 4: Verify everything
  console.log("\n4. Verifying subscriber state...");
  const verifyRes = await fetch(`${BASE_URL}/subscribers/${subscriberId}`, { headers });
  const verifyData = await verifyRes.json();
  const sub = verifyData.subscriber;
  
  console.log("\n=== VERIFICATION ===");
  console.log("Email:", sub?.email_address);
  console.log("First Name:", sub?.first_name);
  console.log("Fields:", JSON.stringify(sub?.fields, null, 2));

  // Check tags
  const subTagsRes = await fetch(`${BASE_URL}/subscribers/${subscriberId}/tags`, { headers });
  const subTagsData = await subTagsRes.json();
  const tagNames = subTagsData.tags?.map(t => t.name) || [];
  
  console.log("Tags:", tagNames);
  console.log("");

  // Validation
  let passed = true;
  
  if (!tagNames.includes("assessment-started")) {
    console.error("FAIL: Missing tag 'assessment-started'");
    passed = false;
  }
  if (!tagNames.includes("assessment-completed")) {
    console.error("FAIL: Missing tag 'assessment-completed'");
    passed = false;
  }
  if (!tagNames.includes("application-submitted")) {
    console.error("FAIL: Missing tag 'application-submitted'");
    passed = false;
  }
  
  if (sub?.fields?.score !== "72") {
    console.error("FAIL: score field not set correctly, got:", sub?.fields?.score);
    passed = false;
  }
  if (sub?.fields?.weakest_area !== "sleep") {
    console.error("FAIL: weakest_area field not set correctly, got:", sub?.fields?.weakest_area);
    passed = false;
  }

  if (passed) {
    console.log("\n✅ ALL CHECKS PASSED");
    console.log(`\nTest email to verify in Kit: ${TEST_EMAIL}`);
  } else {
    console.log("\n❌ SOME CHECKS FAILED");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
