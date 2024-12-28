import { NextRequest, NextResponse } from "next/server";
import client from "@/services/clients/elasticsearch-client";
import sanitizeHtml from "sanitize-html";
import { logger } from "@/services/logger";

export async function GET(request: NextRequest) {
  try {
    // Extract and validate the 'query' parameter
    const url = new URL(request.url);
    const rawQuery = url.searchParams.get("query");

    if (!rawQuery || typeof rawQuery !== "string" || rawQuery.length > 100) {
      logger.warn("Invalid query received.");
      return NextResponse.json(
        { error: "Invalid query parameter." },
        { status: 400 }
      );
    }

    // Sanitize the query
    const query = sanitizeHtml(rawQuery, {
      allowedTags: [],
      allowedAttributes: {},
    });

    // Elasticsearch query
    const response = await client.search({
      index: process.env.ELASTICSEARCH_INDEX || "city_council_meetings",
      body: {
        suggest: {
          title_suggester: {
            prefix: query,
            completion: {
              field: "agendaItemTitle.suggest",
              fuzzy: { fuzziness: "AUTO" },
              size: 5,
            },
          },
        },
      },
    });

    // Parse the suggestions from Elasticsearch response
    const suggestions =
      Array.isArray(response.suggest?.title_suggester[0]?.options)
        ? response.suggest?.title_suggester[0]?.options.map((option: any) => ({
            reference: option._source?.reference,
            title: option._source?.agendaItemTitle,
          }))
        : [];

    // Return the suggestions
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    logger.error(`Elasticsearch Suggestions Error: ${error.message}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
