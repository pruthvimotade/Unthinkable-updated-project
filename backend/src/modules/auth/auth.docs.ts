export const authDocs = {
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a customer account",
        description: "Customer accounts are self-service; privileged roles require provisioning unless explicitly enabled for local development.",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  password: { type: "string", minLength: 12 },
                  name: { type: "string", minLength: 2 },
                  role: { type: "string", enum: ["CUSTOMER", "ADMIN", "AGENT"] },
                },
                required: ["email", "password", "name"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Successfully registered",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error or Email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login",
        description: "Authenticates a user and returns a JWT token.",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  role: { type: "string", enum: ["CUSTOMER", "ADMIN", "AGENT"] },
                },
                required: ["email", "password", "role"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Successfully authenticated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string" },
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            email: { type: "string" },
                            name: { type: "string" },
                            role: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current user profile",
        description: "Returns the profile of the authenticated user.",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
  components: {
    schemas: {},
  },
};
