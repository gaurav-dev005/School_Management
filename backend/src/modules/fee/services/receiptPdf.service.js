import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Matches the "Fee_Receipt_A5" template dimensions exactly (A5 @ 72dpi)
const PAGE_WIDTH = 419.5;
const PAGE_HEIGHT = 595.25;

const COLORS = {
  navy: "#16325c",
  navyDark: "#0f2545",
  ink: "#1a1a1a",
  headerText: "#ffffff",
  totalRowFill: "#eaeef5"
};

const SCHOOL_NAME = process.env.SCHOOL_NAME || "GYANAM PUBLIC SCHOOL";
const SCHOOL_ADDRESS = (
  process.env.SCHOOL_ADDRESS ||
  "Karuaini Chowk, District - East Champaran, Bihar - 845435"
).toUpperCase();
const SCHOOL_PHONE = process.env.SCHOOL_PHONE || "Mob. No.: 7033142403";
// Optional: absolute path (or Buffer) to the school's actual logo image.
// Defaults to the bundled asset extracted from the provided template;
// override with SCHOOL_LOGO_PATH (or the `school.logo` option) for a
// different school/logo. Falls back to a placeholder monogram if missing.
const DEFAULT_LOGO_PATH = path.join(__dirname, "../../../assets/school-logo.jpg");
const SCHOOL_LOGO_PATH = process.env.SCHOOL_LOGO_PATH || DEFAULT_LOGO_PATH;

const DISCLAIMER_TEXT =
  "Note: The monthly tuition fee is to be paid on or between 1st and 15th of the month. Failing which a late fine of Rs. 10/- per day will be charged extra per month. Fee once paid will not be refundable.";

const monthNames = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const getStudentName = (student) => {
  return `${student?.personal?.firstName || ""} ${
    student?.personal?.lastName || ""
  }`.trim();
};

const getClassName = (student) => {
  return student?.academic?.class?.name || "";
};

const getSectionName = (student) => {
  return student?.academic?.section?.name || "";
};

const hasMonthlyPayment = (monthlyPayment) => {
  return Boolean(
    monthlyPayment &&
      monthlyPayment.monthsCount &&
      monthlyPayment.totalMonthlyAmount
  );
};

const getMonthDisplay = (monthlyPayment) => {
  if (!hasMonthlyPayment(monthlyPayment)) {
    return { monthText: "", yearText: "" };
  }

  const { fromMonth, fromYear, toMonth, toYear } = monthlyPayment;

  if (fromYear === toYear) {
    if (fromMonth === toMonth) {
      return {
        monthText: `${monthNames[fromMonth]}`,
        yearText: String(fromYear)
      };
    }

    return {
      monthText: `${monthNames[fromMonth]} - ${monthNames[toMonth]}`,
      yearText: String(fromYear)
    };
  }

  return {
    monthText: `${monthNames[fromMonth]} ${fromYear} - ${monthNames[toMonth]} ${toYear}`,
    yearText: ""
  };
};

const getAmountMap = (payment) => {
  const map = {};

  if (hasMonthlyPayment(payment.monthlyPayment)) {
    const monthly = payment.monthlyPayment;
    const breakup = monthly.perMonthBreakup || {};
    const monthsCount = monthly.monthsCount || 1;

    if (breakup.tuitionFee > 0) {
      map["Monthly Tuition Fee"] = breakup.tuitionFee * monthsCount;
    }

    if (breakup.transportFee > 0) {
      map["Transport Charge"] = breakup.transportFee * monthsCount;
    }

    if (breakup.hostelFee > 0) {
      map["Annual Charge"] = breakup.hostelFee * monthsCount;
    }

    if (breakup.otherMonthlyFee > 0) {
      map["Miscellaneous Charge"] = breakup.otherMonthlyFee * monthsCount;
    }
  }

  if (payment.additionalFees?.length > 0) {
    payment.additionalFees.forEach((fee) => {
      map[fee.feeType] = fee.amount;
    });
  }

  return map;
};

const getFeeAmount = (amountMap, label) => {
  return amountMap[label] ?? "";
};

// ---------------------------------------------------------------------------
// Indian-numbering-system number-to-words, for the "In Words" line.
// ---------------------------------------------------------------------------

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

const twoDigitsToWords = (num) => {
  if (num < 20) return ONES[num];

  const tens = Math.floor(num / 10);
  const rest = num % 10;

  return `${TENS[tens]}${rest ? " " + ONES[rest] : ""}`;
};

const threeDigitsToWords = (num) => {
  const hundreds = Math.floor(num / 100);
  const rest = num % 100;

  const parts = [];

  if (hundreds) {
    parts.push(`${ONES[hundreds]} Hundred`);
  }

  if (rest) {
    parts.push(twoDigitsToWords(rest));
  }

  return parts.join(" ");
};

const numberToWordsIndian = (num) => {
  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundred = num;

  const parts = [];

  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitsToWords(hundred));

  return parts.join(" ");
};

const amountInWords = (amount) => {
  const value = Number(amount) || 0;

  if (value <= 0) return "";

  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  let words = `Rupees ${numberToWordsIndian(rupees)} Only`;

  if (paise > 0) {
    words = `Rupees ${numberToWordsIndian(rupees)} and Paise ${numberToWordsIndian(paise)} Only`;
  }

  return words;
};

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

const drawLogo = (doc, { x, y, size, logoSource, schoolName }) => {
  if (logoSource) {
    try {
      doc.image(logoSource, x, y, { width: size, height: size });
      return;
    } catch (err) {
      // fall through to placeholder if the image fails to load
    }
  }

  const initials = schoolName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 3)
    .join("");

  doc.save();
  doc
    .circle(x + size / 2, y + size / 2, size / 2)
    .lineWidth(1.3)
    .strokeColor(COLORS.navy)
    .stroke();

  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(size * 0.28)
    .text(initials, x, y + size / 2 - size * 0.16, {
      width: size,
      align: "center"
    });
  doc.restore();
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const generateReceiptPdf = ({ payment, school = {} }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: 0
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const schoolName = school.name || SCHOOL_NAME;
    const schoolAddress = (school.address || SCHOOL_ADDRESS).toUpperCase();
    const schoolPhone = school.phone || SCHOOL_PHONE;
    const logoSource = school.logo || SCHOOL_LOGO_PATH;

    const student = payment.student;
    const studentName = getStudentName(student);
    const className = getClassName(student);
    const sectionName = getSectionName(student);
    const monthDisplay = getMonthDisplay(payment.monthlyPayment);
    const amountMap = getAmountMap(payment);

    const marginX = 24;
    const contentW = PAGE_WIDTH - marginX * 2;

    // ---------------- Header ----------------
    const logoSize = 52;
    const logoX = marginX;
    const logoY = 20;

    drawLogo(doc, {
      x: logoX,
      y: logoY,
      size: logoSize,
      logoSource,
      schoolName
    });

    const textX = logoX + logoSize + 10;
    const textW = PAGE_WIDTH - marginX - textX;

    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(17)
      .text(schoolName, textX, logoY, { width: textW, align: "center" });

    doc
      .fillColor(COLORS.ink)
      .font("Helvetica")
      .fontSize(7.3)
      .text(schoolAddress, textX, logoY + 23, { width: textW, align: "center" });

    doc
      .font("Helvetica")
      .fontSize(7.3)
      .text(schoolPhone, textX, logoY + 34, { width: textW, align: "center" });

    let y = logoY + logoSize + 8;

    doc
      .moveTo(marginX, y)
      .lineTo(PAGE_WIDTH - marginX, y)
      .lineWidth(1.5)
      .strokeColor(COLORS.navy)
      .stroke();

    y += 10;

    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("FEE RECEIPT", marginX, y, { width: contentW, align: "center" });

    y += 20;

    // ---------------- Info table (Sl.No/Date, Name/Roll, Father/Reg, Class/Month) ----------------
    const infoRowH = 17;
    const infoColW = contentW / 2;
    const infoLabelW = 74;

    const classDisplay = sectionName ? `${className} - ${sectionName}` : className;
    const monthYearDisplay = [monthDisplay.monthText, monthDisplay.yearText]
      .filter(Boolean)
      .join(" ");

    const infoRows = [
      [
        ["Sl. No.", String(payment.receiptNumber || "")],
        ["Date", formatDate(payment.createdAt)]
      ],
      [
        ["Name of Student", studentName],
        ["Roll No.", String(student?.academic?.rollNumber ?? "")]
      ],
      [
        ["Father's Name", student?.guardian?.fatherName || ""],
        ["Reg. No.", student?.registrationNumber || ""]
      ],
      [
        ["Class", classDisplay],
        ["Month / Year", monthYearDisplay]
      ]
    ];

    const infoTableTop = y;

    doc.lineWidth(0.7).strokeColor(COLORS.navy);

    infoRows.forEach((row, i) => {
      const rowY = infoTableTop + i * infoRowH;

      doc.rect(marginX, rowY, contentW, infoRowH).stroke();
      doc
        .moveTo(marginX + infoColW, rowY)
        .lineTo(marginX + infoColW, rowY + infoRowH)
        .stroke();

      row.forEach(([label, value], colIdx) => {
        const cellX = marginX + colIdx * infoColW;

        doc
          .fillColor(COLORS.ink)
          .font("Helvetica-Bold")
          .fontSize(7.8)
          .text(label, cellX + 5, rowY + 5, { width: infoLabelW });

        doc
          .font("Helvetica")
          .fontSize(7.8)
          .text(value, cellX + infoLabelW + 5, rowY + 5, {
            width: infoColW - infoLabelW - 10
          });
      });
    });

    y = infoTableTop + infoRows.length * infoRowH + 12;

    // ---------------- Particulars table ----------------
    const slW = 26;
    const amtW = 82;
    const particularsW = contentW - slW - amtW;
    const headerH = 20;
    const rowH = 15.2;

    const particulars = [
      "Registration Fee",
      "Admission Fee",
      "Monthly Tuition Fee",
      "Books",
      "Transport Charge",
      "Examination Charge",
      "Late Fine",
      "Miscellaneous Charge",
      "Annual Charge",
      "ID Card, Tai, Belt, Diary, Logo",
      "Call in arrears",
      "Advance"
    ];

    const tableTop = y;

    doc.rect(marginX, tableTop, contentW, headerH).fill(COLORS.navy);

    doc
      .fillColor(COLORS.headerText)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text("Sl.\nNo.", marginX, tableTop + 3, { width: slW, align: "center" });

    doc.text("Particulars", marginX + slW, tableTop + 6, {
      width: particularsW,
      align: "center"
    });

    doc.text("Amount (Rs.)", marginX + slW + particularsW, tableTop + 6, {
      width: amtW,
      align: "center"
    });

    let rowTop = tableTop + headerH;

    doc.lineWidth(0.5).strokeColor(COLORS.navy);

    particulars.forEach((item, idx) => {
      const amount = getFeeAmount(amountMap, item);

      doc.rect(marginX, rowTop, contentW, rowH).stroke();

      doc
        .fillColor(COLORS.ink)
        .font("Helvetica")
        .fontSize(7.3)
        .text(String(idx + 1), marginX, rowTop + 3.5, {
          width: slW,
          align: "center"
        });

      doc.text(item, marginX + slW + 5, rowTop + 3.5, {
        width: particularsW - 10
      });

      if (amount !== "") {
        doc.text(String(amount), marginX + slW + particularsW, rowTop + 3.5, {
          width: amtW - 10,
          align: "right"
        });
      }

      rowTop += rowH;
    });

    // Total row
    doc.rect(marginX, rowTop, contentW, rowH + 3).fillAndStroke(
      COLORS.totalRowFill,
      COLORS.navy
    );

    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(7.6)
      .text("Total", marginX + slW + 5, rowTop + 4.5, {
        width: particularsW - 10
      });

    doc.text(String(payment.amount ?? ""), marginX + slW + particularsW, rowTop + 4.5, {
      width: amtW - 10,
      align: "right"
    });

    rowTop += rowH + 3;

    // vertical column separators + outer border spanning the whole table
    doc.lineWidth(0.6).strokeColor(COLORS.navy);
    doc
      .moveTo(marginX + slW, tableTop)
      .lineTo(marginX + slW, rowTop)
      .stroke();

    doc
      .moveTo(marginX + slW + particularsW, tableTop)
      .lineTo(marginX + slW + particularsW, rowTop)
      .stroke();

    doc.lineWidth(1).rect(marginX, tableTop, contentW, rowTop - tableTop).stroke();

    y = rowTop + 10;

    // ---------------- In Words ----------------
    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(7.8)
      .text("In Words:", marginX, y, { continued: false });

    doc
      .font("Helvetica")
      .fontSize(7.8)
      .text(amountInWords(payment.amount), marginX + 52, y, {
        width: contentW - 52
      });

    y += 18;

    // ---------------- Dues / Paid / Total summary ----------------
    const summaryColW = contentW / 3;
    const dues = 0; // this receipt reflects a completed transaction, no outstanding dues tracked at payment level

    doc.rect(marginX, y, contentW, headerH).fill(COLORS.navy);

    ["Dues (Rs.)", "Paid (Rs.)", "Total (Rs.)"].forEach((label, i) => {
      doc
        .fillColor(COLORS.headerText)
        .font("Helvetica-Bold")
        .fontSize(7.8)
        .text(label, marginX + i * summaryColW, y + 6, {
          width: summaryColW,
          align: "center"
        });
    });

    y += headerH;

    const summaryRowH = rowH + 4;

    doc.lineWidth(0.6).strokeColor(COLORS.navy);
    doc.rect(marginX, y, contentW, summaryRowH).stroke();
    doc
      .moveTo(marginX + summaryColW, y)
      .lineTo(marginX + summaryColW, y + summaryRowH)
      .stroke();
    doc
      .moveTo(marginX + summaryColW * 2, y)
      .lineTo(marginX + summaryColW * 2, y + summaryRowH)
      .stroke();

    const summaryValues = [dues, payment.amount, payment.amount];

    summaryValues.forEach((value, i) => {
      doc
        .fillColor(COLORS.ink)
        .font("Helvetica")
        .fontSize(7.8)
        .text(String(value ?? ""), marginX + i * summaryColW, y + 5, {
          width: summaryColW,
          align: "center"
        });
    });

    y += summaryRowH + 12;

    // ---------------- Note ----------------
    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Oblique")
      .fontSize(6.6)
      .text(DISCLAIMER_TEXT, marginX, y, { width: contentW });

    // ---------------- Signature ----------------
    doc
      .fillColor(COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text("Authority Signatory", PAGE_WIDTH - marginX - 130, PAGE_HEIGHT - 36, {
        width: 130,
        align: "center"
      });

    doc.end();
  });
};
