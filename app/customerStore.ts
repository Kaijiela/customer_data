export const LEGACY_STORAGE_KEY = "customer-card-form-v1";
export const CUSTOMERS_STORAGE_KEY = "customer-card-customers-v2";
export const SELECTED_CUSTOMER_KEY = "customer-card-selected-customer";

export type Fields = Record<string, string>;
export type Checks = Record<string, string[]>;

export type Purchase = {
  purchaseDate: string;
  purchaseItem: string;
  purchaseBrand: string;
  purchaseQty: string;
  purchaseAmount: string;
  purchasePayment: string;
  purchaseNote: string;
};

export type StoredData = {
  fields?: Fields;
  checks?: Checks;
  purchases?: Partial<Purchase>[];
};

export type CustomerRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: Fields;
  checks: Checks;
  purchases: Purchase[];
};

export const emptyPurchase = (): Purchase => ({
  purchaseDate: "",
  purchaseItem: "",
  purchaseBrand: "",
  purchaseQty: "",
  purchaseAmount: "",
  purchasePayment: "",
  purchaseNote: ""
});

export function normalizePurchase(purchase: Partial<Purchase>): Purchase {
  return {
    ...emptyPurchase(),
    ...purchase
  };
}

export function normalizeCustomer(record: Partial<CustomerRecord>): CustomerRecord | null {
  if (!record.id || !record.createdAt || !record.updatedAt) return null;

  return {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    fields: record.fields ?? {},
    checks: record.checks ?? {},
    purchases: (record.purchases ?? []).map(normalizePurchase)
  };
}

export function customerIdentity(fields: Fields) {
  return {
    name: (fields.name ?? "").trim(),
    mobile: (fields.mobile ?? "").trim()
  };
}

function createCustomerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `customer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function hasMeaningfulLegacyData(data: StoredData) {
  const fields = data.fields ?? {};
  const checks = data.checks ?? {};
  const purchases = data.purchases ?? [];

  return (
    Object.values(fields).some((value) => value.trim() !== "") ||
    Object.values(checks).some((values) => values.length > 0) ||
    purchases.some((purchase) => Object.values(purchase).some((value) => String(value ?? "").trim() !== ""))
  );
}

function readStoredCustomers() {
  const raw = window.localStorage.getItem(CUSTOMERS_STORAGE_KEY);
  if (!raw) return [];

  const parsed = JSON.parse(raw) as Partial<CustomerRecord>[];
  if (!Array.isArray(parsed)) return [];

  return parsed.map(normalizeCustomer).filter((customer): customer is CustomerRecord => customer !== null);
}

function migrateLegacyCustomer(customers: CustomerRecord[]) {
  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return customers;

  try {
    const legacyData = JSON.parse(raw) as StoredData;
    if (!hasMeaningfulLegacyData(legacyData)) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return customers;
    }

    const fields = legacyData.fields ?? {};
    const checks = legacyData.checks ?? {};
    const purchases = (legacyData.purchases ?? []).map(normalizePurchase);
    const identity = customerIdentity(fields);
    const matchedIndex = customers.findIndex((customer) => {
      const existing = customerIdentity(customer.fields);
      return existing.name === identity.name && existing.mobile === identity.mobile;
    });
    const now = new Date().toISOString();

    if (matchedIndex >= 0) {
      customers[matchedIndex] = {
        ...customers[matchedIndex],
        updatedAt: now,
        fields,
        checks,
        purchases: purchases.length ? purchases : [emptyPurchase()]
      };
    } else {
      customers.unshift({
        id: createCustomerId(),
        createdAt: now,
        updatedAt: now,
        fields,
        checks,
        purchases: purchases.length ? purchases : [emptyPurchase()]
      });
    }

    window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    return customers;
  }

  return customers;
}

export function loadCustomers() {
  return migrateLegacyCustomer(readStoredCustomers()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveCustomers(customers: CustomerRecord[]) {
  window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
}

export function findCustomerById(id: string) {
  return loadCustomers().find((customer) => customer.id === id);
}

export function upsertCustomer(
  customers: CustomerRecord[],
  data: StoredData,
  currentCustomerId?: string | null
) {
  const now = new Date().toISOString();
  const fields = data.fields ?? {};
  const checks = data.checks ?? {};
  const purchases = (data.purchases ?? []).map(normalizePurchase);
  const identity = customerIdentity(fields);

  const matchedIndex = customers.findIndex((customer) => {
    if (currentCustomerId && customer.id === currentCustomerId) return true;

    const existing = customerIdentity(customer.fields);
    return existing.name === identity.name && existing.mobile === identity.mobile;
  });

  if (matchedIndex >= 0) {
    const updatedCustomer: CustomerRecord = {
      ...customers[matchedIndex],
      updatedAt: now,
      fields,
      checks,
      purchases: purchases.length ? purchases : [emptyPurchase()]
    };
    const nextCustomers = [updatedCustomer, ...customers.filter((_, index) => index !== matchedIndex)];
    return { customer: updatedCustomer, customers: nextCustomers };
  }

  const customer: CustomerRecord = {
    id: createCustomerId(),
    createdAt: now,
    updatedAt: now,
    fields,
    checks,
    purchases: purchases.length ? purchases : [emptyPurchase()]
  };

  return { customer, customers: [customer, ...customers] };
}
