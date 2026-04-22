import { join } from "node:path";
import * as grpc from "@grpc/grpc-js";
import { SERVER_PORT } from "./app_config";
import { convertLinkToMarkdown } from "./scraper/link_to_markdown";
import { ScrapperError } from "./scraper/types/internal";

interface ServerCall<TRequest, _TResponse> {
  request: TRequest;
}

type ServerCallback<TResponse> = (error: grpc.ServiceError | null, response: TResponse) => void;

const mapScraperErrorToGrpc = (error: ScrapperError): grpc.ServiceError => {
  const errorMap: Record<string, { code: number; details: string }> = {
    INVALID_INPUT: {
      code: grpc.status.INVALID_ARGUMENT,
      details: `Invalid input provided: ${error.message}`,
    },
    ERR_HTTP_INVALID_URL: {
      code: grpc.status.INVALID_ARGUMENT,
      details: `Invalid URL format: ${error.message}`,
    },
    ERR_HTTP_REQUEST_FAILED: {
      code: grpc.status.UNAVAILABLE,
      details: `Failed to fetch URL content: ${error.message}`,
    },
    ERR_MARKDOWN_CONTENT_EXTRACTION_FAILED: {
      code: grpc.status.INTERNAL,
      details: `Failed to extract content from webpage: ${error.message}`,
    },
    ERR_MARKDOWN_CONVERSION_FAILED: {
      code: grpc.status.INTERNAL,
      details: `Failed to convert content to markdown: ${error.message}`,
    },
    PDF_MARKDOWN_CONVERSION_FAILED: {
      code: grpc.status.INTERNAL,
      details: `Failed to convert PDF to markdown: ${error.message}`,
    },
  };

  const mappedError = errorMap[error.code] || {
    code: grpc.status.INTERNAL,
    details: `Unexpected scraper error: ${error.message}`,
  };

  return {
    code: mappedError.code,
    details: mappedError.details,
    name: "ScrapperError",
    message: error.message,
  } as grpc.ServiceError;
};

const getMarkdownContent = async (call: ServerCall<any, any>, callback: ServerCallback<unknown>): Promise<void> => {
  try {
    const url = call.request.url;
    const sessionId = call.request.session_id;

    if (!url || !sessionId) {
      callback(
        {
          code: grpc.status.INVALID_ARGUMENT,
          details: `Required parameters ${!url ? "URL" : ""}${!url && !sessionId ? " and " : ""}${!sessionId ? "Session ID" : ""} were not provided in the request`,
        } as grpc.ServiceError,
        null,
      );
      return;
    }

    console.log(`Processing request for URL: ${url}${sessionId ? ` (session: ${sessionId})` : ""}`);

    const markdown = await convertLinkToMarkdown(url);

    const response = {
      content: markdown,
    };

    callback(null, response);
  } catch (error) {
    console.error("Error processing markdown request:", error);

    if (error instanceof ScrapperError) {
      callback(mapScraperErrorToGrpc(error), null);
    } else {
      callback(
        {
          code: grpc.status.INTERNAL,
          details: `Internal server error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        } as grpc.ServiceError,
        null,
      );
    }
  }
};

const startServer = (): void => {
  const server = new grpc.Server();

  const protoPath = join(__dirname, "proto", "scraper.proto");
  // TODO: MOVE TO TS PLUGIN FOR GENERATION, THIS IS GONNA BREAK ON NODE, Bun does not care, but NODE = 💥
  const protoLoader = require("@grpc/proto-loader");

  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const scraperProto = (grpc as any).loadPackageDefinition(packageDefinition).scraper;

  server.addService(scraperProto.ScraperService.service, {
    getMarkdownContent,
  });

  server.bindAsync(
    `0.0.0.0:${SERVER_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, _port: number) => {
      if (err) {
        console.error("Failed to start server:", err);
        return;
      }

      console.log(`🚀 Scraper Service gRPC server running on port ${SERVER_PORT}`);
      console.log(`📋 Available methods:`);
      console.log(`   - GetMarkdownContent: Convert URL content to markdown`);
    },
  );
};

export { startServer };
