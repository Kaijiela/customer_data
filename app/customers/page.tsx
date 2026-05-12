"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { CustomerRecord, SELECTED_CUSTOMER_KEY, loadCustomers } from "../customerStore";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function purchaseCount(customer: CustomerRecord) {
  return customer.purchases.filter((purchase) =>
    Object.values(purchase).some((value) => String(value ?? "").trim() !== "")
  ).length;
}

function customerSearchText(customer: CustomerRecord) {
  return [customer.fields.name, customer.fields.mobile, customer.fields.tel, customer.fields.email]
    .join(" ")
    .toLowerCase();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setCustomers(loadCustomers());
    setIsReady(true);
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return customers;

    return customers.filter((customer) => customerSearchText(customer).includes(keyword));
  }, [customers, query]);

  function updateQuery(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function openCustomer(customer: CustomerRecord) {
    window.localStorage.setItem(SELECTED_CUSTOMER_KEY, customer.id);
    window.location.href = `/?customerId=${encodeURIComponent(customer.id)}`;
  }

  function createCustomer() {
    window.localStorage.removeItem(SELECTED_CUSTOMER_KEY);
    window.location.href = "/?new=1";
  }

  return (
    <>
      <div className="topbar">
        <button type="button" onClick={() => (window.location.href = "/")}>
          回資料卡
        </button>
      </div>

      <main className="sheet customer-list-sheet">
        <div className="list-heading">
          <div>
            <h1>已填寫顧客</h1>
            <p>搜尋姓名、手機、電話或 Email，點擊顧客即可查看與更新資料。</p>
          </div>
          <button type="button" className="small-button" onClick={createCustomer}>
            新增顧客
          </button>
        </div>

        <label className="search-field">
          <span>搜尋顧客</span>
          <input
            type="search"
            value={query}
            onChange={updateQuery}
            placeholder="輸入姓名、手機、電話或 Email"
            autoFocus
          />
        </label>

        {isReady && customers.length === 0 ? (
          <div className="empty-state">
            <h2>目前還沒有已儲存的顧客</h2>
            <p>回到資料卡填寫姓名與行動電話後按儲存，就會出現在這裡。</p>
            <button type="button" onClick={createCustomer}>
              建立第一位顧客
            </button>
          </div>
        ) : (
          <div className="customers-table-wrapper">
            <table className="customers-table" aria-label="已填寫顧客列表">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>手機</th>
                  <th>購買筆數</th>
                  <th>最近更新</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    tabIndex={0}
                    onClick={() => openCustomer(customer)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") openCustomer(customer);
                    }}
                  >
                    <td>{customer.fields.name || "未填姓名"}</td>
                    <td>{customer.fields.mobile || "-"}</td>
                    <td>{purchaseCount(customer)}</td>
                    <td>{formatDate(customer.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isReady && customers.length > 0 && filteredCustomers.length === 0 ? (
              <div className="empty-state compact">
                <h2>找不到符合的顧客</h2>
                <p>請換一個姓名、手機、電話或 Email 試試看。</p>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}
