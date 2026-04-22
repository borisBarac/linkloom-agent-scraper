import { join } from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = join(__dirname, "..", "..", "proto_files", "scraper.proto");
const SERVER_ADDRESS = "localhost:50053";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const scraperProto = (grpc as any).loadPackageDefinition(packageDefinition).scraper;
const client = new scraperProto.ScraperService(SERVER_ADDRESS, grpc.credentials.createInsecure());

const testMarkdownExtraction = async (url: string): Promise<void> => {
  console.log(`\n🔍 Testing URL: ${url}`);

  return new Promise((resolve) => {
    const request = {
      url: url,
      session_id: `test_${Date.now()}`,
    };

    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 30);

    client.getMarkdownContent(request, { deadline: deadline.getTime() }, (error: any, response: any) => {
      if (error) {
        console.error(`❌ Error: ${error.details} (code: ${error.code})`);
        resolve();
        return;
      }

      const content = response.content;
      console.log(`✅ Success! Extracted ${content.length} characters of markdown`);
      console.log(`📝 Preview: ${content.substring(0, 200)}${content.length > 200 ? "..." : ""}`);
      resolve();
    });
  });
};

const runTests = async (): Promise<void> => {
  console.log("🧪 Testing gRPC Scraper Service Integration");

  const testUrls = ["https://example.com", "https://httpbin.org/html", "https://invalid-url-that-does-not-exist.com"];

  for (const url of testUrls) {
    await testMarkdownExtraction(url);
  }

  console.log("\n🏁 Tests completed");
  process.exit(0);
};

runTests().catch(console.error);
