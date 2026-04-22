# Scraper Service

A gRPC-based web scraping microservice built with TypeScript and Bun.

## Features

- **ScrapeUrl**: Scrape content from URLs with configurable options
- **GetScrapeStatus**: Check the status of asynchronous scraping jobs
- **ListScrapedUrls**: Retrieve a list of previously scraped URLs

## Setup

1. Install dependencies:
```bash
bun install
```

2. Compile protocol buffers:
```bash
bun run compile:proto
```

3. Start the server:
```bash
bun run start
```

The server will start on port `50053`.

## gRPC Service Definition

The service is defined in `proto/scraper.proto` with the following methods:

### ScrapeUrl
Scrapes content from a URL with optional selectors and configuration.

**Request:**
- `url` (string): Target URL to scrape
- `selectors` (repeated string): CSS selectors to extract
- `include_images` (bool): Whether to extract images
- `include_links` (bool): Whether to extract links
- `timeout_seconds` (int32): Request timeout

**Response:**
- `success` (bool): Operation success status
- `url` (string): Scraped URL
- `title` (string): Page title
- `content` (string): Extracted content
- `images` (repeated string): Extracted image URLs
- `links` (repeated string): Extracted link URLs
- `error_message` (string): Error details if failed
- `scraped_at` (int64): Timestamp of scraping
- `processing_time_ms` (int64): Processing duration

### GetScrapeStatus
Checks the status of a scraping job.

**Request:**
- `job_id` (string): Job identifier

**Response:**
- `job_id` (string): Job identifier
- `status` (string): "pending", "processing", "completed", "failed"
- `progress_percentage` (int32): Progress 0-100
- `message` (string): Status message
- `created_at` (int64): Job creation timestamp
- `completed_at` (int64): Job completion timestamp

### ListScrapedUrls
Lists previously scraped URLs with pagination.

**Request:**
- `limit` (int32): Maximum results per page
- `offset` (int32): Results offset
- `filter` (string): Optional filter by domain or pattern

**Response:**
- `urls` (repeated ScrapedUrlInfo): List of scraped URLs
- `total_count` (int32): Total number of results

## Development

- **Format code**: `bun run format`
- **Lint code**: `bun run lint`
- **Type check**: `bun run type_check`
- **Build**: `bun run build`

## Architecture

The service uses:
- **gRPC** for high-performance RPC communication
- **Protocol Buffers** for efficient serialization
- **TypeScript** for type safety
- **Bun** for fast runtime performance
