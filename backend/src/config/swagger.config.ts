import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./env.config";
import { authDocs } from "../modules/auth/auth.docs";
import { orderDocs } from "../modules/order/order.docs";
import { pricingDocs } from "../modules/pricing/pricing.docs";
import { assignmentDocs } from "../modules/assignment/assignment.docs";
import { trackingDocs } from "../modules/tracking/tracking.docs";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Logistics Platform API",
    version: "1.0.0",
    description: "Backend infrastructure for the logistics platform. Includes comprehensive documentation for Auth, Orders, Pricing, Assignment, Tracking, and Notifications.",
  },
  servers: [{ url: env.API_PREFIX }],
  paths: {
    ...authDocs.paths,
    ...orderDocs.paths,
    ...pricingDocs.paths,
    ...assignmentDocs.paths,
    ...trackingDocs.paths,
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ...authDocs.components.schemas,
      ...orderDocs.components.schemas,
      ...pricingDocs.components.schemas,
      ...assignmentDocs.components.schemas,
      ...trackingDocs.components.schemas,
    },
  },
};

export function mountSwagger(app: Express): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
