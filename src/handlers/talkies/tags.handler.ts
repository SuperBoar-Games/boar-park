// Talkies game tags API handlers for CRUD and tag counting operations

import { sql } from "bun";
import { jsonResponse } from "../../utils";
import {
    GET_ALL_TAGS_QUERY,
    CHECK_TAG_EXISTS_QUERY,
    INSERT_TAG_QUERY,
    UPDATE_TAG_QUERY,
    DELETE_TAG_QUERY,
    GET_TAG_COUNTS_BY_HERO_QUERY
} from "../../queries/talkies/tags.queries";

export async function getTagsHandler(): Promise<Response> {
    try {
        const tags = await sql.unsafe(GET_ALL_TAGS_QUERY);
        return jsonResponse({ success: true, data: tags, message: "Tags fetched successfully" });
    } catch (error) {
        console.error("Error fetching tags:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch tags" }, 500);
    }
}

export async function createTagHandler(body: any): Promise<Response> {
    const { name } = body;
    if (!name) {
        return jsonResponse({ success: false, data: null, message: "Missing tag name" }, 400);
    }

    try {
        const exists = await sql.unsafe(CHECK_TAG_EXISTS_QUERY, [name]);
        if (exists && exists.length > 0) {
            return jsonResponse({ success: false, data: null, message: "Tag already exists" }, 409);
        }

        const tag = await sql.unsafe(INSERT_TAG_QUERY, [name]);
        return jsonResponse({ success: true, data: tag[0], message: "Tag created successfully" });
    } catch (error) {
        console.error("Error creating tag:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to create tag" }, 500);
    }
}

export async function updateTagHandler(id: number, body: any): Promise<Response> {
    const { name } = body;
    if (!name) {
        return jsonResponse({ success: false, data: null, message: "Missing tag name" }, 400);
    }

    try {
        const tag = await sql.unsafe(UPDATE_TAG_QUERY, [name, id]);
        if (!tag || tag.length === 0) {
            return jsonResponse({ success: false, data: null, message: "Tag not found" }, 404);
        }
        return jsonResponse({ success: true, data: tag[0], message: "Tag updated successfully" });
    } catch (error) {
        console.error("Error updating tag:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to update tag" }, 500);
    }
}

export async function deleteTagHandler(id: number): Promise<Response> {
    try {
        const tag = await sql.unsafe(DELETE_TAG_QUERY, [id]);
        if (!tag || tag.length === 0) {
            return jsonResponse({ success: false, data: null, message: "Tag not found" }, 404);
        }
        return jsonResponse({ success: true, data: tag[0], message: "Tag deleted successfully" });
    } catch (error) {
        console.error("Error deleting tag:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to delete tag" }, 500);
    }
}

export async function getTagCountsByHeroHandler(heroId: number): Promise<Response> {
    try {
        const tagCounts = await sql.unsafe(GET_TAG_COUNTS_BY_HERO_QUERY, [heroId]);
        return jsonResponse({ success: true, data: tagCounts, message: "Tag counts fetched successfully" });
    } catch (error) {
        console.error("Error fetching tag counts:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch tag counts" }, 500);
    }
}
