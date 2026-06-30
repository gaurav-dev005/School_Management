import PDFDocument from "pdfkit";

const COLORS = {
  paper: "#efe1b6",
  ink: "#315d6b",
  lightInk: "#6f8790"
};

const SCHOOL_NAME = "VEENA SHIKSHAN SANSTHAN";
const SCHOOL_NAME_HINDI = "वीणा शिक्षण संस्थान";

const DISCLAIMER_TEXT =
  "Note: Paying monthly tuition fee after the 15th of the month may attract late fee as per school rules. Fee once paid will not be refundable.";

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
    return {
      monthText: "",
      yearText: ""
    };
  }

  const {
    fromMonth,
    fromYear,
    toMonth,
    toYear
  } = monthlyPayment;

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

const drawText = (doc, text, x, y, options = {}) => {
  const {
    size = 9,
    bold = false,
    width,
    align = "left"
  } = options;

  doc
    .fillColor(COLORS.ink)
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(size)
    .text(text || "", x, y, {
      width,
      align
    });
};

const drawLine = (doc, x1, y1, x2, y2, width = 1) => {
  doc
    .strokeColor(COLORS.ink)
    .lineWidth(width)
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .stroke();
};

const drawRect = (doc, x, y, w, h, width = 1) => {
  doc
    .strokeColor(COLORS.ink)
    .lineWidth(width)
    .rect(x, y, w, h)
    .stroke();
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
  return amountMap[label] || "";
};

const drawFieldLine = (doc, label, value, x, y, labelWidth, lineWidth) => {
  drawText(doc, label, x, y, {
    size: 8.5,
    bold: true
  });

  const valueX = x + labelWidth;
  drawText(doc, value, valueX, y, {
    size: 8.5,
    width: lineWidth - 5
  });

  drawLine(doc, valueX, y + 11, valueX + lineWidth, y + 11, 0.5);
};

export const generateReceiptPdf = ({ payment }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;

    const student = payment.student;
    const studentName = getStudentName(student);
    const className = getClassName(student);
    const sectionName = getSectionName(student);
    const monthDisplay = getMonthDisplay(payment.monthlyPayment);
    const amountMap = getAmountMap(payment);

    doc.rect(0, 0, pageW, pageH).fill(COLORS.paper);

    const x = 28;
    const y = 22;
    const w = pageW - 56;
    const h = pageH - 44;

    drawRect(doc, x, y, w, h, 1.3);
    drawRect(doc, x + 4, y + 4, w - 8, h - 8, 0.8);

    // top heading
    drawText(doc, SCHOOL_NAME, x + w / 2 - 120, y + 10, {
      size: 14,
      bold: true,
      width: 240,
      align: "center"
    });

    drawText(doc, "Dues Slip", x + w - 120, y + 14, {
      size: 15,
      bold: true,
      width: 90,
      align: "center"
    });

    drawText(doc, "Sl. No.", x + 16, y + 18, {
      size: 9
    });

    drawText(doc, String(payment.receiptNumber || ""), x + 68, y + 16, {
      size: 16,
      bold: true
    });

    drawText(doc, `Date`, x + w - 160, y + 42, {
      size: 8.5,
      bold: true
    });
    drawText(doc, formatDate(payment.createdAt), x + w - 125, y + 42, {
      size: 8.5,
      width: 90
    });
    drawLine(doc, x + w - 128, y + 53, x + w - 34, y + 53, 0.5);

    // details area
    let infoY = y + 58;

    drawFieldLine(doc, "Name of the Student:", studentName, x + 16, infoY, 132, 250);
    infoY += 20;

    drawFieldLine(
      doc,
      "Father's Name:",
      student?.guardian?.fatherName || "",
      x + 16,
      infoY,
      95,
      287
    );
    infoY += 20;

    drawFieldLine(doc, "Class:", className, x + 16, infoY, 38, 70);

    drawFieldLine(
      doc,
      "Roll No. (Reg. No.):",
      `${student?.academic?.rollNumber || ""} (${student?.registrationNumber || ""})`,
      x + 170,
      infoY,
      110,
      170
    );
    infoY += 20;

    drawFieldLine(
      doc,
      "for the Month of:",
      monthDisplay.monthText,
      x + 16,
      infoY,
      102,
      170
    );

    drawFieldLine(
      doc,
      "Year:",
      monthDisplay.yearText,
      x + 305,
      infoY,
      32,
      72
    );

    // table sizes
    const noteX = x + 14;
    const noteY = y + 146;
    const noteW = 70;
    const noteH = 310;

    const tableX = noteX + noteW + 12;
    const tableY = noteY;
    const tableW = w - 110;
    const headerH = 24;
    const rowH = 18;
    const particularsCount = 12;
    const particularsH = particularsCount * rowH;
    const totalsH = 60;
    const tableH = headerH + particularsH + totalsH;

    const slW = 42;
    const particularsW = 360;
    const amountW = 110;
    const paiseW = 32;

    drawRect(doc, noteX, noteY, noteW, noteH, 1);
    drawText(doc, "In Words :-", noteX + 8, noteY + 8, {
      size: 8.5,
      bold: true,
      width: noteW - 16
    });

    drawText(doc, DISCLAIMER_TEXT, noteX + 8, noteY + 30, {
      size: 7.2,
      width: noteW - 16,
      align: "left"
    });

    // table
    drawRect(doc, tableX, tableY, tableW, tableH, 1);

    drawLine(doc, tableX + slW, tableY, tableX + slW, tableY + tableH);
    drawLine(
      doc,
      tableX + slW + particularsW,
      tableY,
      tableX + slW + particularsW,
      tableY + tableH
    );
    drawLine(
      doc,
      tableX + slW + particularsW + amountW,
      tableY,
      tableX + slW + particularsW + amountW,
      tableY + tableH
    );

    drawLine(doc, tableX, tableY + headerH, tableX + tableW, tableY + headerH);

    drawText(doc, "Sl.\nNo.", tableX + 7, tableY + 4, {
      size: 8,
      bold: true,
      width: 28,
      align: "center"
    });

    drawText(doc, "PARTICULARS", tableX + slW + 120, tableY + 7, {
      size: 9,
      bold: true,
      width: 120,
      align: "center"
    });

    drawText(doc, "Amount", tableX + slW + particularsW + 24, tableY + 7, {
      size: 9,
      bold: true,
      width: 60,
      align: "center"
    });

    drawText(doc, "P.", tableX + slW + particularsW + amountW + 8, tableY + 7, {
      size: 9,
      bold: true
    });

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

    particulars.forEach((item, index) => {
      const rowTop = tableY + headerH + index * rowH;
      const amount = getFeeAmount(amountMap, item);

      drawLine(doc, tableX, rowTop + rowH, tableX + tableW, rowTop + rowH, 0.4);

      drawText(doc, `${index + 1}.`, tableX + 8, rowTop + 4, {
        size: 8,
        width: 24,
        align: "right"
      });

      drawText(doc, item, tableX + slW + 10, rowTop + 4, {
        size: 8.5,
        bold: true,
        width: particularsW - 20
      });

      if (amount !== "") {
        drawText(doc, String(amount), tableX + slW + particularsW + 15, rowTop + 4, {
          size: 8.8,
          width: amountW - 25,
          align: "right"
        });
      }

      drawLine(
        doc,
        tableX + slW + particularsW - 55,
        rowTop + 14,
        tableX + slW + particularsW - 8,
        rowTop + 14,
        0.25
      );
    });

    // totals block
    const totalsStartY = tableY + headerH + particularsH;
    drawLine(doc, tableX, totalsStartY, tableX + tableW, totalsStartY, 1);

    const totalLabelW = 95;
    drawLine(
      doc,
      tableX + slW + totalLabelW,
      totalsStartY,
      tableX + slW + totalLabelW,
      tableY + tableH
    );

    const totalRows = [
      ["TOTAL", payment.amount],
      ["PAID", payment.amount],
      ["DUES", ""]
    ];

    totalRows.forEach((row, idx) => {
      const rowTop = totalsStartY + idx * 20;

      if (idx > 0) {
        drawLine(doc, tableX, rowTop, tableX + tableW, rowTop, 0.5);
      }

      drawText(doc, row[0], tableX + slW + 12, rowTop + 5, {
        size: 8.7,
        bold: true
      });

      if (row[1] !== "") {
        drawText(
          doc,
          String(row[1]),
          tableX + slW + particularsW + 15,
          rowTop + 5,
          {
            size: 8.8,
            width: amountW - 25,
            align: "right"
          }
        );
      }
    });

    // watermark
    doc.save();
    doc.opacity(0.12);
    drawText(doc, SCHOOL_NAME, tableX + 160, tableY + 120, {
      size: 32,
      bold: true,
      width: 260,
      align: "center"
    });
    doc.restore();

    // bottom signature
    drawText(doc, "Authority Signatory", x + w - 150, y + h - 52, {
      size: 8.5,
      width: 120,
      align: "center"
    });

    drawText(doc, SCHOOL_NAME_HINDI, x + w - 160, y + h - 32, {
      size: 8.5,
      width: 140,
      align: "center"
    });

    doc.end();
  });
};