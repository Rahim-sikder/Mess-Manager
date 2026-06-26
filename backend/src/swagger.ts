import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Mess Manager API",
      version: "2.0.0",
      description:
        "REST API for managing monthly meals, bazar expenses, members, room rent, enrollments, and user accounts.",
    },
    servers: [{ url: "/api", description: "API base" }],
    tags: [
      { name: "Rent",        description: "Monthly room rent" },
      { name: "Summary",     description: "Monthly financial summary" },
      { name: "Today",       description: "Today's meal & bazar overview" },
      { name: "Members",     description: "Mess members CRUD + role management" },
      { name: "Users",       description: "Auth user ↔ member linking" },
      { name: "Bazar",       description: "Admin bazar entries" },
      { name: "My Bazar",    description: "User's own bazar entries" },
      { name: "Meals",       description: "Admin meal entries" },
      { name: "Meal Opts",   description: "User meal opt-in/out per day" },
      { name: "Enrollments", description: "Monthly meal enrollment management" },
    ],
    components: {
      schemas: {
        // ── Shared ────────────────────────────────────────────────────────────
        Error: {
          type: "object",
          properties: { error: { type: "string", example: "Something went wrong" } },
        },
        Status: {
          type: "string",
          enum: ["pending", "approved", "rejected"],
          example: "pending",
        },
        Role: {
          type: "string",
          enum: ["admin", "member"],
          example: "member",
        },
        MealOption: {
          type: "string",
          enum: ["yes", "no", "half"],
          example: "yes",
        },

        // ── Members ───────────────────────────────────────────────────────────
        Member: {
          type: "object",
          properties: {
            id:     { type: "string", format: "uuid" },
            name:   { type: "string", example: "Rahim" },
            active: { type: "boolean", example: true },
            role:   { $ref: "#/components/schemas/Role" },
            userId: { type: "string", nullable: true, example: "auth-uuid" },
          },
        },

        // ── Users ─────────────────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            id:         { type: "string", format: "uuid", description: "Auth user ID" },
            email:      { type: "string", format: "email", example: "rahim@example.com" },
            memberId:   { type: "string", format: "uuid", nullable: true },
            memberName: { type: "string", nullable: true, example: "Rahim" },
            role:       { $ref: "#/components/schemas/Role" },
          },
        },

        // ── Bazar ─────────────────────────────────────────────────────────────
        BazarEntry: {
          type: "object",
          properties: {
            id:          { type: "string", format: "uuid" },
            memberId:    { type: "string", format: "uuid" },
            memberName:  { type: "string", example: "Rahim" },
            date:        { type: "string", format: "date", example: "2026-06-15" },
            amount:      { type: "number", example: 450.5 },
            description: { type: "string", nullable: true, example: "Hilsa fish" },
            category:    { type: "string", nullable: true, example: "Fish" },
            status:      { $ref: "#/components/schemas/Status" },
            submittedBy: { type: "string", nullable: true, example: "auth-uuid" },
          },
        },

        // ── Meals ─────────────────────────────────────────────────────────────
        MealEntry: {
          type: "object",
          properties: {
            id:          { type: "string", format: "uuid" },
            memberId:    { type: "string", format: "uuid" },
            memberName:  { type: "string", example: "Rahim" },
            date:        { type: "string", format: "date", example: "2026-06-15" },
            breakfast:   { type: "number", example: 1 },
            lunch:       { type: "number", example: 1 },
            dinner:      { type: "number", example: 1 },
            mealCount:   { type: "number", example: 3 },
            status:      { $ref: "#/components/schemas/Status" },
            submittedBy: { type: "string", nullable: true },
          },
        },

        // ── Meal Opts ─────────────────────────────────────────────────────────
        MealOpt: {
          type: "object",
          properties: {
            id:         { type: "string", format: "uuid" },
            userId:     { type: "string", example: "auth-uuid" },
            memberId:   { type: "string", format: "uuid" },
            date:       { type: "string", format: "date", example: "2026-06-15" },
            mealStatus: { $ref: "#/components/schemas/MealOption" },
          },
        },

        // ── Enrollments ───────────────────────────────────────────────────────
        Enrollment: {
          type: "object",
          properties: {
            id:            { type: "string", format: "uuid" },
            userId:        { type: "string", example: "auth-uuid" },
            memberId:      { type: "string", format: "uuid" },
            month:         { type: "integer", minimum: 1, maximum: 12, example: 6 },
            year:          { type: "integer", example: 2026 },
            defaultLunch:  { $ref: "#/components/schemas/MealOption" },
            defaultDinner: { $ref: "#/components/schemas/MealOption" },
            remarks:       { type: "string", nullable: true },
          },
        },
        EnrollmentDate: {
          type: "object",
          properties: {
            id:           { type: "string", format: "uuid" },
            enrollmentId: { type: "string", format: "uuid" },
            date:         { type: "string", format: "date", example: "2026-06-15" },
            lunchOption:  { $ref: "#/components/schemas/MealOption" },
            dinnerOption: { $ref: "#/components/schemas/MealOption" },
            remarks:      { type: "string", nullable: true },
          },
        },

        // ── Summary ───────────────────────────────────────────────────────────
        MonthlySummary: {
          type: "object",
          properties: {
            totalBazar:         { type: "number", example: 12000 },
            totalMeals:         { type: "number", example: 90 },
            mealRate:           { type: "number", example: 133.33 },
            monthlyRoomRent:    { type: "number", example: 12000 },
            roomRentPerPerson:  { type: "number", example: 3000 },
            activeMembersCount: { type: "integer", example: 4 },
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  memberName:    { type: "string" },
                  totalMeals:    { type: "number" },
                  mealCost:      { type: "number" },
                  roomRentShare: { type: "number" },
                  totalCost:     { type: "number" },
                  bazarPaid:     { type: "number" },
                  finalBalance:  { type: "number" },
                  status:        { type: "string", enum: ["GET", "PAY", "SETTLED"] },
                },
              },
            },
          },
        },

        // ── Today ─────────────────────────────────────────────────────────────
        TodaySummary: {
          type: "object",
          properties: {
            date:       { type: "string", format: "date", example: "2026-06-27" },
            totalMeals: { type: "integer", example: 5 },
            totalBazar: { type: "number",  example: 320.0 },
            meals: { type: "array", items: { $ref: "#/components/schemas/MealEntry" } },
            bazar: { type: "array", items: { $ref: "#/components/schemas/BazarEntry" } },
          },
        },
      },
    },
    paths: {

      // ════════════════════════════════════════════════════════════════════════
      // RENT
      // ════════════════════════════════════════════════════════════════════════
      "/rent": {
        get: {
          tags: ["Rent"],
          summary: "Get monthly room rent",
          parameters: [
            { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "year",  in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
          ],
          responses: {
            200: { description: "Rent amount", content: { "application/json": { schema: { type: "object", properties: { amount: { type: "number", example: 12000 } } } } } },
            400: { description: "Invalid params", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Server error",   content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          tags: ["Rent"],
          summary: "Set monthly room rent",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["month", "year", "amount"],
                  properties: {
                    month:  { type: "integer", minimum: 1, maximum: 12 },
                    year:   { type: "integer", minimum: 2000 },
                    amount: { type: "number",  minimum: 0 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated rent",    content: { "application/json": { schema: { type: "object", properties: { amount: { type: "number" } } } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // SUMMARY
      // ════════════════════════════════════════════════════════════════════════
      "/summary": {
        get: {
          tags: ["Summary"],
          summary: "Get monthly financial summary for all members",
          parameters: [
            { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "year",  in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
          ],
          responses: {
            200: { description: "Monthly summary", content: { "application/json": { schema: { $ref: "#/components/schemas/MonthlySummary" } } } },
            400: { description: "Invalid params",  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Server error",    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // TODAY
      // ════════════════════════════════════════════════════════════════════════
      "/today": {
        get: {
          tags: ["Today"],
          summary: "Get today's meal and bazar overview",
          parameters: [
            {
              name: "date", in: "query", required: false,
              description: "ISO date — defaults to server's current date",
              schema: { type: "string", format: "date", example: "2026-06-27" },
            },
          ],
          responses: {
            200: { description: "Today's summary", content: { "application/json": { schema: { $ref: "#/components/schemas/TodaySummary" } } } },
            500: { description: "Server error",    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // MEMBERS
      // ════════════════════════════════════════════════════════════════════════
      "/members": {
        get: {
          tags: ["Members"],
          summary: "List all members",
          responses: {
            200: { description: "Array of members", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Member" } } } } },
            500: { description: "Server error",     content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Members"],
          summary: "Add a new member",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", example: "Karim" } } } } },
          },
          responses: {
            201: { description: "Created member",  content: { "application/json": { schema: { $ref: "#/components/schemas/Member" } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/members/{id}": {
        patch: {
          tags: ["Members"],
          summary: "Activate or deactivate a member",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["active"], properties: { active: { type: "boolean", example: true } } } } },
          },
          responses: {
            200: { description: "Updated member",  content: { "application/json": { schema: { $ref: "#/components/schemas/Member" } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Not found",        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/members/{id}/role": {
        patch: {
          tags: ["Members"],
          summary: "Set a member's role",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["role"], properties: { role: { $ref: "#/components/schemas/Role" } } } } },
          },
          responses: {
            200: { description: "Updated member", content: { "application/json": { schema: { $ref: "#/components/schemas/Member" } } } },
            400: { description: "Invalid role",   content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Not found",      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // USERS
      // ════════════════════════════════════════════════════════════════════════
      "/users": {
        get: {
          tags: ["Users"],
          summary: "List all auth users merged with member records",
          responses: {
            200: { description: "Array of users", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } },
            500: { description: "Server error",   content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/me": {
        get: {
          tags: ["Users"],
          summary: "Get the member record linked to an auth user",
          parameters: [
            { name: "userId", in: "query", required: true, schema: { type: "string" }, description: "Auth user UUID" },
          ],
          responses: {
            200: { description: "Linked member (or null)", content: { "application/json": { schema: { $ref: "#/components/schemas/Member" } } } },
            400: { description: "Missing userId",          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            500: { description: "Server error",            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/me/link": {
        post: {
          tags: ["Users"],
          summary: "Link an auth user to a member",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "memberId"],
                  properties: {
                    userId:   { type: "string", example: "auth-uuid" },
                    memberId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated member",  content: { "application/json": { schema: { $ref: "#/components/schemas/Member" } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // BAZAR (admin)
      // ════════════════════════════════════════════════════════════════════════
      "/bazar": {
        get: {
          tags: ["Bazar"],
          summary: "List bazar entries for a month",
          parameters: [
            { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "year",  in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
          ],
          responses: {
            200: { description: "Array of bazar entries", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/BazarEntry" } } } } },
            400: { description: "Invalid params",          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Bazar"],
          summary: "Add an admin bazar entry",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["memberId", "date", "amount"],
                  properties: {
                    memberId:    { type: "string", format: "uuid" },
                    date:        { type: "string", format: "date" },
                    amount:      { type: "number", minimum: 0.01 },
                    description: { type: "string", example: "Hilsa fish" },
                    category:    { type: "string", example: "Fish" },
                    submittedBy: { type: "string", example: "auth-uuid" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Created entry",   content: { "application/json": { schema: { $ref: "#/components/schemas/BazarEntry" } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/bazar/{id}": {
        put: {
          tags: ["Bazar"],
          summary: "Update a bazar entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["memberId", "date", "amount"],
                  properties: {
                    memberId:    { type: "string", format: "uuid" },
                    date:        { type: "string", format: "date" },
                    amount:      { type: "number", minimum: 0.01 },
                    description: { type: "string" },
                    category:    { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated entry",   content: { "application/json": { schema: { $ref: "#/components/schemas/BazarEntry" } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Bazar"],
          summary: "Delete a bazar entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            204: { description: "Deleted successfully" },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/bazar/{id}/status": {
        patch: {
          tags: ["Bazar"],
          summary: "Approve or reject a bazar entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { $ref: "#/components/schemas/Status" } } } } },
          },
          responses: {
            200: { description: "Updated entry",  content: { "application/json": { schema: { $ref: "#/components/schemas/BazarEntry" } } } },
            400: { description: "Invalid status", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Not found",      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // MY BAZAR (user's own entries)
      // ════════════════════════════════════════════════════════════════════════
      "/my-bazar": {
        get: {
          tags: ["My Bazar"],
          summary: "List the current user's bazar entries",
          parameters: [
            { name: "userId", in: "query", required: true,  schema: { type: "string" }, description: "Auth user UUID" },
            { name: "all",    in: "query", required: false, schema: { type: "boolean" }, description: "Return all months if true" },
          ],
          responses: {
            200: { description: "Array of bazar entries", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/BazarEntry" } } } } },
            400: { description: "Missing userId",          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["My Bazar"],
          summary: "Create a bazar entry for the current user (status: pending)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "memberId", "date", "amount"],
                  properties: {
                    userId:      { type: "string", example: "auth-uuid" },
                    memberId:    { type: "string", format: "uuid" },
                    date:        { type: "string", format: "date" },
                    amount:      { type: "number", minimum: 0.01 },
                    description: { type: "string" },
                    category:    { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Created entry",   content: { "application/json": { schema: { $ref: "#/components/schemas/BazarEntry" } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/my-bazar/{id}": {
        put: {
          tags: ["My Bazar"],
          summary: "Update the user's own bazar entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["date", "amount"],
                  properties: {
                    date:        { type: "string", format: "date" },
                    amount:      { type: "number", minimum: 0.01 },
                    description: { type: "string" },
                    category:    { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated entry",              content: { "application/json": { schema: { $ref: "#/components/schemas/BazarEntry" } } } },
            400: { description: "Validation error",           content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            403: { description: "Forbidden — not the owner", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["My Bazar"],
          summary: "Delete the user's own bazar entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            204: { description: "Deleted successfully" },
            403: { description: "Forbidden — not the owner", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // MEALS (admin)
      // ════════════════════════════════════════════════════════════════════════
      "/meals": {
        get: {
          tags: ["Meals"],
          summary: "List meal entries for a month",
          parameters: [
            { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "year",  in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
          ],
          responses: {
            200: { description: "Array of meal entries", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/MealEntry" } } } } },
            400: { description: "Invalid params",        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Meals"],
          summary: "Add or update a meal entry (upsert by member + date)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["memberId", "date"],
                  properties: {
                    memberId:    { type: "string", format: "uuid" },
                    date:        { type: "string", format: "date" },
                    breakfast:   { type: "number", minimum: 0, maximum: 3, default: 0 },
                    lunch:       { type: "number", minimum: 0, maximum: 3, default: 0 },
                    dinner:      { type: "number", minimum: 0, maximum: 3, default: 0 },
                    submittedBy: { type: "string", example: "auth-uuid" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Created/updated entry", content: { "application/json": { schema: { $ref: "#/components/schemas/MealEntry" } } } },
            400: { description: "Validation error",      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/meals/{id}": {
        delete: {
          tags: ["Meals"],
          summary: "Delete a meal entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            204: { description: "Deleted successfully" },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/meals/{id}/status": {
        patch: {
          tags: ["Meals"],
          summary: "Approve or reject a meal entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { $ref: "#/components/schemas/Status" } } } } },
          },
          responses: {
            200: { description: "Updated entry",  content: { "application/json": { schema: { $ref: "#/components/schemas/MealEntry" } } } },
            400: { description: "Invalid status", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Not found",      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // MEAL OPTS
      // ════════════════════════════════════════════════════════════════════════
      "/meal-opts": {
        get: {
          tags: ["Meal Opts"],
          summary: "Get a user's meal options for a month",
          parameters: [
            { name: "userId", in: "query", required: true, schema: { type: "string" } },
            { name: "month",  in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "year",   in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
          ],
          responses: {
            200: { description: "Array of meal opts", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/MealOpt" } } } } },
            400: { description: "Missing params",     content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Meal Opts"],
          summary: "Upsert a user's meal option for a date",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "memberId", "date", "mealStatus"],
                  properties: {
                    userId:     { type: "string", example: "auth-uuid" },
                    memberId:   { type: "string", format: "uuid" },
                    date:       { type: "string", format: "date" },
                    mealStatus: { $ref: "#/components/schemas/MealOption" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Upserted meal opt", content: { "application/json": { schema: { $ref: "#/components/schemas/MealOpt" } } } },
            400: { description: "Validation error",  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/meal-opts/{id}": {
        delete: {
          tags: ["Meal Opts"],
          summary: "Delete a meal opt entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            204: { description: "Deleted successfully" },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // ENROLLMENTS
      // ════════════════════════════════════════════════════════════════════════
      "/enrollments": {
        get: {
          tags: ["Enrollments"],
          summary: "Get all enrollments for a user",
          parameters: [
            { name: "userId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Array of enrollments", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Enrollment" } } } } },
            400: { description: "Missing userId",       content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Enrollments"],
          summary: "Create a monthly meal enrollment",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "memberId", "month", "year"],
                  properties: {
                    userId:        { type: "string", example: "auth-uuid" },
                    memberId:      { type: "string", format: "uuid" },
                    month:         { type: "integer", minimum: 1, maximum: 12 },
                    year:          { type: "integer", minimum: 2000 },
                    defaultLunch:  { $ref: "#/components/schemas/MealOption" },
                    defaultDinner: { $ref: "#/components/schemas/MealOption" },
                    remarks:       { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Created enrollment", content: { "application/json": { schema: { $ref: "#/components/schemas/Enrollment" } } } },
            400: { description: "Validation error",   content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/enrollments/{id}": {
        delete: {
          tags: ["Enrollments"],
          summary: "Delete an enrollment and all its dates",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            204: { description: "Deleted successfully" },
            400: { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/enrollments/{id}/dates": {
        get: {
          tags: ["Enrollments"],
          summary: "Get all date entries for an enrollment",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Array of enrollment dates", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/EnrollmentDate" } } } } },
            400: { description: "Error",                     content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/enrollment-dates/{id}": {
        patch: {
          tags: ["Enrollments"],
          summary: "Update a single enrollment date (lunch/dinner option)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lunchOption:  { $ref: "#/components/schemas/MealOption" },
                    dinnerOption: { $ref: "#/components/schemas/MealOption" },
                    remarks:      { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated date",    content: { "application/json": { schema: { $ref: "#/components/schemas/EnrollmentDate" } } } },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            404: { description: "Not found",        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // MEAL SUMMARY  (all-users monthly counts)
      // ════════════════════════════════════════════════════════════════════════
      "/meal-summary": {
        get: {
          tags: ["Enrollments"],
          summary: "Get all-users meal counts for a month",
          parameters: [
            { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "year",  in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
          ],
          responses: {
            200: {
              description: "Per-member meal totals",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        memberId:    { type: "string", format: "uuid" },
                        memberName:  { type: "string" },
                        totalLunch:  { type: "integer" },
                        totalDinner: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
            400: { description: "Invalid params", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // MY MEAL DATES
      // ════════════════════════════════════════════════════════════════════════
      "/my-meal-dates": {
        get: {
          tags: ["Enrollments"],
          summary: "Get a user's meal enrollment dates for a month",
          parameters: [
            { name: "userId", in: "query", required: true, schema: { type: "string" } },
            { name: "month",  in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "year",   in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
          ],
          responses: {
            200: { description: "Array of enrollment dates", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/EnrollmentDate" } } } } },
            400: { description: "Missing params",            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
