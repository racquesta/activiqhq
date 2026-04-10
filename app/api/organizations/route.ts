import { organizationCreateSchema } from "@/lib/validations";
import {
  jsonFromCaughtRouteError,
  slugConflict,
  validationError,
  validationErrorFromZod,
} from "@/lib/api/errors";
import { requireUserOrThrow } from "@/lib/auth/require-user";

/**
 * `POST` — create organization with globally unique slug and owner membership
 * (see DB trigger `organizations_bootstrap_after_insert`).
 */
export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUserOrThrow();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationError("Request body must be valid JSON.");
    }

    const parsed = organizationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorFromZod(parsed.error);
    }

    const { name, slug } = parsed.data;

    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name,
        slug,
        created_by_user_id: user.id,
      })
      .select("id, slug, name")
      .single();

    if (error) {
      if (error.code === "23505") {
        return slugConflict();
      }
      throw error;
    }

    return Response.json(data, { status: 201 });
  } catch (e) {
    return jsonFromCaughtRouteError(e);
  }
}
