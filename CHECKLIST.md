# Scraper Service — Standalone Extraction Checklist

## Phase 1: Break Monorepo Dependencies

- [ ] **1.1** Make `tsconfig.json` standalone — remove `extends: "../../tsconfig.base.json"`, define all compiler options inline
- [ ] **1.2** Make `biome.json` standalone — set `"root": true`, remove `"extends": "//"`, define full config

## Phase 2: Remove gRPC Server

- [ ] **2.1** Delete `src/scraper-server.ts`
- [ ] **2.2** Delete `src/test-client.ts`
- [ ] **2.3** Delete `generated/` directory
- [ ] **2.4** Remove gRPC deps from `package.json`: `@grpc/grpc-js`, `@grpc/proto-loader`, `grpc-tools`
- [ ] **2.5** Remove proto-related scripts from `package.json`: `compile:proto`, `build`
- [ ] **2.6** Update `index.ts` entry point — remove gRPC server startup, export library functions only
- [ ] **2.7** Remove `SERVER_PORT` export from `app_config.ts` (no longer needed)

## Phase 3: ENV Configuration

- [ ] **3.1** Add `PAGE_LOAD_TIMEOUT`, `FRAME_TIMEOUT`, `PDF_DOWNLOAD_TIMEOUT` to `.env` and `env.example`
- [ ] **3.2** Add `OPENAI_API_KEY` and `GEMINI_API_KEY` to `.env` and `env.example`
- [ ] **3.3** Validate all `Bun.env.*` usages across codebase are documented in env files

## Phase 4: Update Packages

- [ ] **4.1** Update all `dependencies` to latest versions
- [ ] **4.2** Update all `devDependencies` to latest versions
- [ ] **4.3** Remove `@types/puppeteer` (puppeteer ships its own types since v20+)
- [ ] **4.4** Evaluate removing `@langchain/google-genai` and `@langchain/openai` if `text_to_vecotor.ts` is not needed
- [ ] **4.5** Run `bun install` to regenerate lockfile

## Phase 5: Fix Code Issues

- [ ] **5.1** Remove `eslint-disable` comment in `types/internal.ts:1` (project uses biome, not eslint)
- [ ] **5.2** Run `bun run lint` and fix all reported errors
- [ ] **5.3** Run `bun run type_check` and fix all type errors
- [ ] **5.4** Run `bun run format` to normalize code style

## Phase 6: Verification

- [ ] **6.1** `bun run check` passes (biome format + lint)
- [ ] **6.2** `bun run type_check` passes (TypeScript)
- [ ] **6.3** `bun run start` runs without errors
- [ ] **6.4** All test files pass
