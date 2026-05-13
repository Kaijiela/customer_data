import { Pool } from "pg";

let pool: Pool | undefined;

function getPool() {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is not configured.");
  }

  pool ??= new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3
  });

  return pool;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const payload = await request.json();
    const fields = payload.fields ?? {};
    const checks = payload.checks ?? {};
    const purchases = payload.purchases ?? [];
    const name = asText(fields.name);
    const mobile = asText(fields.mobile);

    if (!name || !mobile) {
      return Response.json({ error: "姓名和行動電話必填，才能儲存顧客資料。" }, { status: 400 });
    }

    const result = await getPool().query(
      `
        insert into public.customers (
          card_no,
          name,
          mobile,
          tel,
          email,
          fields,
          checks,
          purchases
        )
        values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
        on conflict (name, mobile)
        do update set
          card_no = excluded.card_no,
          tel = excluded.tel,
          email = excluded.email,
          fields = excluded.fields,
          checks = excluded.checks,
          purchases = excluded.purchases
        returning id, created_at, updated_at
      `,
      [
        asText(fields.cardNo),
        name,
        mobile,
        asText(fields.tel),
        asText(fields.email),
        JSON.stringify(fields),
        JSON.stringify(checks),
        JSON.stringify(purchases)
      ]
    );

    const row = result.rows[0] as {
      id: string;
      created_at: string;
      updated_at: string;
    };

    return Response.json({
      customer: {
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "顧客資料寫入資料庫失敗。" }, { status: 500 });
  }
};

export const config = {
  path: "/api/customers"
};
