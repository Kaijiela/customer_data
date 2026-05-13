import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { StoredData } from "../../customerStore";

export const runtime = "nodejs";

type CustomerPayload = StoredData & {
  currentCustomerId?: string | null;
};

declare global {
  var customerCardPool: Pool | undefined;
}

function getPool() {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is not configured.");
  }

  if (!globalThis.customerCardPool) {
    globalThis.customerCardPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3
    });
  }

  return globalThis.customerCardPool;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validatePayload(payload: CustomerPayload) {
  const fields = payload.fields ?? {};
  const checks = payload.checks ?? {};
  const purchases = payload.purchases ?? [];
  const name = asText(fields.name);
  const mobile = asText(fields.mobile);

  if (!name || !mobile) {
    return { error: "姓名和行動電話必填，才能儲存顧客資料。" };
  }

  return {
    data: {
      cardNo: asText(fields.cardNo),
      name,
      mobile,
      tel: asText(fields.tel),
      email: asText(fields.email),
      fields,
      checks,
      purchases
    }
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CustomerPayload;
    const validated = validatePayload(payload);

    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const customer = validated.data;
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
        customer.cardNo,
        customer.name,
        customer.mobile,
        customer.tel,
        customer.email,
        JSON.stringify(customer.fields),
        JSON.stringify(customer.checks),
        JSON.stringify(customer.purchases)
      ]
    );

    const row = result.rows[0] as {
      id: string;
      created_at: string;
      updated_at: string;
    };

    return NextResponse.json({
      customer: {
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "顧客資料寫入資料庫失敗。" }, { status: 500 });
  }
}
