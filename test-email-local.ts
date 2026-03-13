import { sendSummaryEmail } from './src/lib/email';

async function testEmail() {
  const applications = [
    {
      jobTitle: "Développeur Fullstack",
      company: "Tech Corp",
      sourceUrl: "https://example.com/job1"
    }
  ];

  try {
    console.log("Testing sendSummaryEmail with provided keys...");
    console.log("BREVO_API_KEY snippet:", process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 5) + "..." : "missing");
    
    await sendSummaryEmail("test@example.com", "Douglas", applications);
    console.log("Success: Email function completed.");
  } catch (e) {
    console.error("Caught error:", e);
  }
}

testEmail();
