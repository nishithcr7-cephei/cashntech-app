# Dealer Finance Program – Pharma Domain (Reference)

**Purpose:** Base document for this project. Future questions and features will be related to this flow.

---

## Asli Problem Kya Hai?

- Dealer (distributor) manufacturer (Sun Pharma, Cipla) se medicines **abhi** pay karke kharidta hai.
- Wahi medicines retailers (local chemists) ko **60 days credit** par bech chuka hai → paise 60 din baad aayenge.
- **Working capital gap:** Manufacturer ko aaj paise, dealer ko paise baad mein.

---

## Solution: Dealer Finance Program

### 3 Players

| Player | Role |
|--------|------|
| **1. Anchor (Manufacturer)** | Bade pharma (Sun Pharma, Cipla). Trusted dealers ko financing dilwate hain. Financing company ko guarantee dete hain. |
| **2. Dealer (Distributor)** | Bulk mein medicines kharidta hai, retailers ko bechta hai. Manufacturer ko turant payment deni hoti hai → financing ki zarurat. |
| **3. CashnTech (Financing Company)** | Dealer ko turant paise deti hai. Baad mein dealer se EMI leti hai. |

---

## Kaise Kaam Karta Hai? (Real Example)

**Scenario:** Dealer ko Sun Pharma se ₹1 crore ki medicines chahiye, paas sirf ₹20 lakh cash.

### Step 1: Dealer PID apply karta hai
- Amount: ₹80 lakh financing
- Repayment: 12 months

### Step 2: Approval process
- **Dealer Maker** – mobile app mein invoice banata hai
- **Dealer Checker** – verify aur approve karta hai
- CashnTech – verifier documents check karta hai
- **Anchor (Sun Pharma)** – final approval deta hai

### Step 3: Disbursement (72 hours)
- CashnTech ₹80 lakh dealer ko de deti hai
- Dealer Sun Pharma ko ₹1 crore pay karta hai → medicines mil jaati hain

### Step 4: Sales
- Dealer retailers ko medicines bechta hai 60 days credit par
- Total sales e.g. ₹1.2 crore (profit bhi)

### Step 5: Repayment
- Monthly EMI: e.g. ₹8.88 lakh (12 months)
- 14% interest rate par

---

## 3 Types of Financing

### 1. PID (Purchase Invoice Discounting)
- **Kab:** Jab medicines **kharidni** hain
- **Example:** ₹50 lakh order, paas ₹10 lakh → ₹40 lakh financing, 12 months mein wapas

### 2. SID (Sales Invoice Discounting)
- **Kab:** Jab medicines **bech di** hain par payment pending
- **Example:** Retailers ko ₹30 lakh ki medicines 60 days credit par bech di; naye stock ke liye paise chahiye → SID apply → ₹28.8 lakh turant (2% monthly discount); 60 din baad retailers ₹30 lakh CashnTech ko denge

### 3. OD (Overdraft)
- **Kab:** Flexible, bar-bar paise chahiye
- **Example:** ₹1 crore credit limit; jitna chahiye withdraw, jab chahiye wapas; interest sirf use kiye hue amount par; baar-baar use kar sakte ho

---

## Dealer Checker Ki Role

- **Approve** karna hota hai, **create** nahi.
- Check karna:
  - Invoice amount sahi?
  - Medicine batch numbers valid?
  - Credit limit available?
  - Documents upload? (GST invoice, delivery challan)
  - Manufacturer details correct?
  - Dealer ki **DPD (Days Past Due)** status theek?

### DPD bands
- **0–30 DPD** = Safe ✅  
- **31–60 DPD** = Risky ⚠️  
- **60+ DPD** = High Risk ❌  

---

## Sabko Kya Fayda?

| Party | Fayda |
|-------|--------|
| **Dealer** | Zyada stock, working capital bachta hai, 30–50% revenue badh sakta hai |
| **Manufacturer** | Zyada sales, dealers loyal |
| **Retailers** | Medicines ki supply consistent |
| **CashnTech** | Safe lending (anchor guarantee), profit |

---

*Is document ko project ke liye base reference maana jayega. Isi flow ke hisaab se app (Anchor Maker, Dealer Maker, Dealer Checker, Invoice Overview, Invoice List & Approvals, Disbursement, PID/SID/OD) design hai.*
