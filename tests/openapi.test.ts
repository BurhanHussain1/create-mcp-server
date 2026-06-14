import { describe, it, expect } from "vitest";
import { parseOpenApi } from "../src/openapi.js";

const spec = {
  openapi: "3.0.0",
  info: { title: "Test API", version: "1.0.0" },
  servers: [{ url: "https://api.example.com/v1" }],
  paths: {
    "/pets": {
      get: {
        operationId: "listPets",
        summary: "List pets",
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer" },
          },
        ],
      },
      post: {
        operationId: "createPet",
        summary: "Create a pet",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
    "/pets/{petId}": {
      get: {
        operationId: "getPet",
        summary: "Get a pet",
        parameters: [
          {
            name: "petId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
      },
    },
  },
};

describe("parseOpenApi", () => {
  it("extracts the title and base URL", async () => {
    const api = await parseOpenApi(spec);
    expect(api.title).toBe("Test API");
    expect(api.baseUrl).toBe("https://api.example.com/v1");
  });

  it("creates one operation per endpoint method", async () => {
    const api = await parseOpenApi(spec);
    const names = api.operations.map((o) => o.toolName).sort();
    expect(names).toEqual(["createPet", "getPet", "listPets"]);
  });

  it("maps integer query params to the number type", async () => {
    const api = await parseOpenApi(spec);
    const listPets = api.operations.find((o) => o.toolName === "listPets")!;
    const limit = listPets.params.find((p) => p.name === "limit")!;
    expect(limit.type).toBe("number");
    expect(limit.in).toBe("query");
    expect(limit.required).toBe(false);
  });

  it("marks path params as required", async () => {
    const api = await parseOpenApi(spec);
    const getPet = api.operations.find((o) => o.toolName === "getPet")!;
    const petId = getPet.params.find((p) => p.name === "petId")!;
    expect(petId.in).toBe("path");
    expect(petId.required).toBe(true);
  });

  it("detects request bodies", async () => {
    const api = await parseOpenApi(spec);
    const createPet = api.operations.find((o) => o.toolName === "createPet")!;
    expect(createPet.hasBody).toBe(true);
  });

  it("makes duplicate operationIds unique", async () => {
    const dup = {
      openapi: "3.0.0",
      info: { title: "Dup", version: "1.0.0" },
      servers: [{ url: "https://x.test" }],
      paths: {
        "/a": { get: { operationId: "same", summary: "a" } },
        "/b": { get: { operationId: "same", summary: "b" } },
      },
    };
    const api = await parseOpenApi(dup);
    const names = api.operations.map((o) => o.toolName);
    expect(new Set(names).size).toBe(names.length); // all unique
    expect(names).toContain("same");
    expect(names).toContain("same_2");
  });
});
