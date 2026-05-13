"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Checks,
  Fields,
  LEGACY_STORAGE_KEY,
  Purchase,
  SELECTED_CUSTOMER_KEY,
  StoredData,
  customerIdentity,
  emptyPurchase,
  findCustomerById,
  loadCustomers,
  normalizePurchase,
  saveCustomers,
  upsertCustomer
} from "./customerStore";

const initialFields: Fields = {
  cardNo: "",
  firstYear: "",
  firstMonth: "",
  firstDay: "",
  name: "",
  addressType: "",
  address: "",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
  tel: "",
  job: "",
  jobOther: "",
  mobile: "",
  contactStart: "",
  contactEnd: "",
  gender: "",
  email: "",
  marketing: "",
  makeup: "",
  interestOther: "",
  brandName: "",
  useCleanser: "",
  useSoapCream: "",
  useToner: "",
  useLotion: "",
  useSerum: "",
  useCream: "",
  useExfoliant: "",
  useDayCream: "",
  useFoundation: "",
  useLipstick: "",
  useEyeshadow: "",
  useBrow: "",
  useSunscreen: "",
  useMemo: "",
  useCleanserNote: "",
  useSoapCreamNote: "",
  useTonerNote: "",
  useLotionNote: "",
  useSerumNote: "",
  useCreamNote: "",
  useExfoliantNote: "",
  useDayCreamNote: "",
  useFoundationNote: "",
  useLipstickNote: "",
  useEyeshadowNote: "",
  useBrowNote: "",
  useSunscreenNote: "",
  useMemoNote: "",
  serviceRecord: "",
  contactRecord: "",
  skinAdvice: "",
  nextAction: ""
};

const initialChecks: Checks = {
  marketingWay: [],
  concern: [],
  life: [],
  condition: [],
  interest: [],
  brandType: []
};

const choiceGroups = {
  addressType: ["住宅", "公司"],
  job: ["學生", "主婦", "OL", "自營業"],
  gender: ["男", "女", "其他"],
  marketing: ["是", "否"],
  marketingWay: ["電話", "印刷郵件", "電子郵件", "簡訊"],
  concern: ["鬆弛", "細紋", "乾燥", "暗沉", "色斑", "角質", "疲倦", "敏感", "痘痘", "出油", "黑眼圈"],
  life: ["日曬", "冷氣", "偏食", "抽煙", "嗜咖啡紅茶", "睡眠不足", "易感壓力", "常使用電腦或上網"],
  condition: ["胃腸不適", "生理不順", "長期服藥", "容易感冒", "手腳寒冷症", "無"],
  makeup: ["每天", "偶爾", "沒有"],
  interest: ["流行", "上網", "旅行", "運動", "閱讀", "音樂", "跳舞", "電影", "逛街"],
  brandType: ["日系", "歐美系", "開架系", "醫美系"]
};

const productColumns = [
  ["useCleanser", "潔膚"],
  ["useSoapCream", "皂霜"],
  ["useToner", "化妝水"],
  ["useLotion", "乳液"],
  ["useSerum", "美容液"],
  ["useCream", "營養霜"],
  ["useExfoliant", "角質液"],
  ["useDayCream", "日霜"],
  ["useFoundation", "粉底"],
  ["useLipstick", "口紅"],
  ["useEyeshadow", "眼影"],
  ["useBrow", "眉"],
  ["useSunscreen", "防曬"],
  ["useMemo", "MEMO"]
] as const;

const paymentOptions = ["", "現金", "信用卡", "轉帳", "行動支付", "其他"];

export default function CustomerCardPage() {
  const [fields, setFields] = useState<Fields>(initialFields);
  const [checks, setChecks] = useState<Checks>(initialChecks);
  const [purchases, setPurchases] = useState<Purchase[]>([emptyPurchase()]);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const hadLegacyData = Boolean(window.localStorage.getItem(LEGACY_STORAGE_KEY));
      const customers = loadCustomers();
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "1") {
        window.localStorage.removeItem(SELECTED_CUSTOMER_KEY);
        setIsReady(true);
        return;
      }

      const requestedCustomerId = params.get("customerId") ?? window.localStorage.getItem(SELECTED_CUSTOMER_KEY);
      const selectedCustomer =
        (requestedCustomerId ? findCustomerById(requestedCustomerId) : undefined) ??
        (hadLegacyData && customers.length ? customers[0] : undefined);

      if (!selectedCustomer) {
        setIsReady(true);
        return;
      }

      setCurrentCustomerId(selectedCustomer.id);
      window.localStorage.setItem(SELECTED_CUSTOMER_KEY, selectedCustomer.id);
      setFields({ ...initialFields, ...selectedCustomer.fields });
      setChecks({ ...initialChecks, ...selectedCustomer.checks });
      const restoredPurchases = selectedCustomer.purchases.map(normalizePurchase);
      setPurchases(restoredPurchases.length ? restoredPurchases : [emptyPurchase()]);
    } catch {
      setPurchases([emptyPurchase()]);
    } finally {
      setIsReady(true);
    }
  }, []);

  const storedData = useMemo<StoredData>(
    () => ({
      fields,
      checks,
      purchases
    }),
    [fields, checks, purchases]
  );

  function updateField(name: string, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function updateText(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    updateField(event.target.name, event.target.value);
  }

  function updateCheck(name: string, value: string, checked: boolean) {
    setChecks((current) => {
      const values = current[name] ?? [];
      return {
        ...current,
        [name]: checked ? [...values, value] : values.filter((item) => item !== value)
      };
    });
  }

  function addPurchaseRow() {
    setPurchases((current) => [...current, emptyPurchase()]);
  }

  function updatePurchase(index: number, name: keyof Purchase, value: string) {
    setPurchases((current) =>
      current.map((purchase, purchaseIndex) => (purchaseIndex === index ? { ...purchase, [name]: value } : purchase))
    );
  }

  function removePurchase(index: number) {
    setPurchases((current) => current.filter((_, purchaseIndex) => purchaseIndex !== index));
  }

  async function saveForm() {
    const identity = customerIdentity(fields);
    if (!identity.name || !identity.mobile) {
      window.alert("請先填寫姓名與行動電話，這樣之後才能搜尋並辨識這位顧客。");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...storedData,
          currentCustomerId
        })
      });
      const payload = (await response.json()) as {
        customer?: { id: string };
        error?: string;
      };

      if (!response.ok || !payload.customer) {
        throw new Error(payload.error ?? "顧客資料寫入資料庫失敗。");
      }

      const result = upsertCustomer(loadCustomers(), storedData, payload.customer.id);
      saveCustomers(result.customers);
      setCurrentCustomerId(result.customer.id);
      window.localStorage.setItem(SELECTED_CUSTOMER_KEY, result.customer.id);
      window.alert("顧客資料已儲存到資料庫，並保留在此瀏覽器作為本機備份。");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "顧客資料寫入資料庫失敗。");
    } finally {
      setIsSaving(false);
    }
  }

  function clearForm() {
    if (!window.confirm("確定要清空目前表單嗎？")) return;
    setFields(initialFields);
    setChecks(initialChecks);
    setPurchases([emptyPurchase()]);
    setCurrentCustomerId(null);
    window.localStorage.removeItem(SELECTED_CUSTOMER_KEY);
    window.history.replaceState(null, "", "/");
  }

  const textInput = (name: string, className = "input", extraProps: Record<string, string> = {}) => (
    <input className={className} name={name} value={fields[name] ?? ""} onChange={updateText} {...extraProps} />
  );

  const radioChoice = (name: string, value: string) => (
    <label className="choice" key={value}>
      <input type="radio" name={name} value={value} checked={fields[name] === value} onChange={updateText} />
      {value}
    </label>
  );

  const checkChoice = (name: string, value: string) => (
    <label className="choice" key={value}>
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={(checks[name] ?? []).includes(value)}
        onChange={(event) => updateCheck(name, value, event.target.checked)}
      />
      {value}
    </label>
  );

  return (
    <>
      <div className="topbar">
        <button type="button" onClick={() => (window.location.href = "/customers")}>
          已填寫顧客
        </button>
        <button type="button" onClick={() => window.print()}>
          列印
        </button>
        <button type="button" className="secondary" onClick={saveForm} disabled={!isReady || isSaving}>
          {isSaving ? "儲存中..." : "儲存到資料庫"}
        </button>
        <button type="button" className="secondary" onClick={clearForm}>
          清空表單
        </button>
      </div>

      <main className="sheet">
        <div className="title">
          <h1>顧客資料卡</h1>
          <label className="no">NO.{textInput("cardNo", "line-input", { autoComplete: "off" })}</label>
        </div>

        <section className="visit-row" aria-label="初次來店日期">
          <span>初次來店：</span>
          {textInput("firstYear", "line-input", { inputMode: "numeric" })}
          <span>年</span>
          {textInput("firstMonth", "line-input", { inputMode: "numeric" })}
          <span>月</span>
          {textInput("firstDay", "line-input", { inputMode: "numeric" })}
          <span>日</span>
        </section>

        <form autoComplete="on">
          <table className="form-table" aria-label="顧客基本資料">
            <tbody>
              <tr>
                <th>姓名</th>
                <td className="wide">{textInput("name")}</td>
                <th>地址</th>
                <td colSpan={3}>
                  <div className="inline compact">
                    {choiceGroups.addressType.map((value) => radioChoice("addressType", value))}
                    {textInput("address", "input", { "aria-label": "地址" })}
                  </div>
                </td>
              </tr>
              <tr>
                <th>生日</th>
                <td>
                  <div className="date-fields">
                    {textInput("birthYear", "line-input", { inputMode: "numeric", "aria-label": "出生年" })}
                    <span>年</span>
                    {textInput("birthMonth", "line-input", { inputMode: "numeric", "aria-label": "出生月" })}
                    <span>月</span>
                    {textInput("birthDay", "line-input", { inputMode: "numeric", "aria-label": "出生日" })}
                    <span>日</span>
                  </div>
                </td>
                <th>TEL</th>
                <td colSpan={3}>{textInput("tel", "input", { inputMode: "tel" })}</td>
              </tr>
              <tr>
                <th>職業</th>
                <td>
                  <div className="inline compact">
                    {choiceGroups.job.map((value) => radioChoice("job", value))}
                    {textInput("jobOther", "input", { placeholder: "其他" })}
                  </div>
                </td>
                <th>行動</th>
                <td colSpan={3}>
                  <div className="contact-fields">
                    {textInput("mobile", "input", { inputMode: "tel", "aria-label": "行動電話" })}
                    <span>方便連絡時間：</span>
                    {textInput("contactStart", "line-input", { "aria-label": "方便連絡起始時間" })}
                    <span>點 ~</span>
                    {textInput("contactEnd", "line-input", { "aria-label": "方便連絡結束時間" })}
                    <span>點</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th>性別</th>
                <td>
                  <div className="inline compact">{choiceGroups.gender.map((value) => radioChoice("gender", value))}</div>
                </td>
                <th>e-mail</th>
                <td colSpan={3}>{textInput("email", "input", { type: "email" })}</td>
              </tr>
              <tr>
                <td colSpan={6}>
                  <div className="inline">
                    <span>是否願意收到企業活動相關訊息：</span>
                    {radioChoice("marketing", "是")}
                    {choiceGroups.marketingWay.map((value) => checkChoice("marketingWay", value))}
                    {radioChoice("marketing", "否")}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <h2 className="section-title">《個人小檔案（可複選）》</h2>
          <table className="mini-table" aria-label="個人小檔案">
            <tbody>
              <tr>
                <th>在意</th>
                <td>
                  <div className="inline compact">{choiceGroups.concern.map((value) => checkChoice("concern", value))}</div>
                </td>
              </tr>
              <tr>
                <th>生活</th>
                <td>
                  <div className="inline compact">{choiceGroups.life.map((value) => checkChoice("life", value))}</div>
                </td>
              </tr>
              <tr>
                <th>體況</th>
                <td>
                  <div className="inline compact">{choiceGroups.condition.map((value) => checkChoice("condition", value))}</div>
                </td>
              </tr>
              <tr>
                <th>彩妝</th>
                <td>
                  <div className="inline compact">{choiceGroups.makeup.map((value) => radioChoice("makeup", value))}</div>
                </td>
              </tr>
              <tr>
                <th>興趣</th>
                <td>
                  <div className="inline compact">
                    {choiceGroups.interest.map((value) => checkChoice("interest", value))}
                    <label className="choice">其他{textInput("interestOther", "input", { "aria-label": "其他興趣" })}</label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="brand-line">
            <div className="inline">
              <span>《目前使用的品牌・系列：</span>
              {choiceGroups.brandType.map((value) => checkChoice("brandType", value))}
              {textInput("brandName", "input", { placeholder: "品牌 / 系列名稱" })}
            </div>
          </div>

          <div className="product-table-wrapper">
            <table className="product-table" aria-label="目前使用品目">
              <thead>
                <tr>
                  <th>使用品目</th>
                  {productColumns.map(([, label]) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>品牌</td>
                  {productColumns.map(([name]) => (
                    <td key={name}>{textInput(name, "product-input")}</td>
                  ))}
                </tr>
                <tr>
                  <td>備註</td>
                  {productColumns.map(([name]) => (
                    <td key={`${name}Note`}>{textInput(`${name}Note`, "product-input")}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="purchase-title">
            <h2>購買紀錄</h2>
            <button type="button" className="small-button" onClick={addPurchaseRow}>
              新增一筆
            </button>
          </div>
          <div className="record-wrapper">
            <table className="purchase-table" aria-label="購買紀錄">
              <thead>
                <tr>
                  <th className="date-col">日期</th>
                  <th className="item-col">品項</th>
                  <th className="brand-col">品牌 / 系列</th>
                  <th className="qty-col">數量</th>
                  <th className="amount-col">金額</th>
                  <th className="payment-col">付款方式</th>
                  <th>備註</th>
                  <th className="action-col"> </th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        name="purchaseDate[]"
                        type="date"
                        value={purchase.purchaseDate}
                        onChange={(event) => updatePurchase(index, "purchaseDate", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        name="purchaseItem[]"
                        value={purchase.purchaseItem}
                        onChange={(event) => updatePurchase(index, "purchaseItem", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        name="purchaseBrand[]"
                        value={purchase.purchaseBrand}
                        onChange={(event) => updatePurchase(index, "purchaseBrand", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        name="purchaseQty[]"
                        inputMode="numeric"
                        value={purchase.purchaseQty}
                        onChange={(event) => updatePurchase(index, "purchaseQty", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        name="purchaseAmount[]"
                        inputMode="decimal"
                        value={purchase.purchaseAmount}
                        onChange={(event) => updatePurchase(index, "purchaseAmount", event.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        name="purchasePayment[]"
                        value={purchase.purchasePayment}
                        onChange={(event) => updatePurchase(index, "purchasePayment", event.target.value)}
                      >
                        {paymentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        name="purchaseNote[]"
                        value={purchase.purchaseNote}
                        onChange={(event) => updatePurchase(index, "purchaseNote", event.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="remove-row"
                        aria-label="刪除此購買紀錄"
                        onClick={() => removePurchase(index)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="purchase-title">
            <h2>以下由美容顧問填寫</h2>
          </div>
          <div className="notes">
            <div className="note-box">
              <label htmlFor="serviceRecord">服務紀錄</label>
              <textarea id="serviceRecord" name="serviceRecord" value={fields.serviceRecord} onChange={updateText} />
            </div>
            <div className="note-box">
              <label htmlFor="contactRecord">聯絡紀錄</label>
              <textarea id="contactRecord" name="contactRecord" value={fields.contactRecord} onChange={updateText} />
            </div>
            <div className="note-box">
              <label htmlFor="skinAdvice">膚況觀察 / 建議</label>
              <textarea id="skinAdvice" name="skinAdvice" value={fields.skinAdvice} onChange={updateText} />
            </div>
            <div className="note-box">
              <label htmlFor="nextAction">下次追蹤 / 預約</label>
              <textarea id="nextAction" name="nextAction" value={fields.nextAction} onChange={updateText} />
            </div>
          </div>
        </form>

        <p className="footer-note">此頁資料可列印；按「儲存到此瀏覽器」會保存到目前電腦的瀏覽器中。</p>
      </main>
    </>
  );
}
