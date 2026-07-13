export const assignmentDocs = {
  paths: {
    "/assignments/auto": {
      post: {
        summary: "Auto-Assign Agent",
        description: "Automatically evaluates online agents and assigns the best match to the order.",
        tags: ["Assignment", "Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                },
                required: ["orderId"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Agent assigned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        assignment: { type: "object" },
                        event: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Bad request or Order is not PENDING" },
          "404": { description: "Order not found or No available agents found" },
        },
      },
    },
    "/assignments/manual": {
      post: {
        summary: "Manual Assignment",
        description: "Manually overrides and assigns a specific agent to an order.",
        tags: ["Assignment", "Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  agentId: { type: "string", format: "uuid" },
                  reason: { type: "string" },
                },
                required: ["orderId", "agentId"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Agent assigned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        assignment: { type: "object" },
                        event: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Bad request or Order is not PENDING" },
          "404": { description: "Order not found" },
        },
      },
    },
  },
  components: {
    schemas: {},
  },
};
