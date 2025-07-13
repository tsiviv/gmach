import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fontBase64 from './embedded_font_example';
import { formatAmount } from './helper';
export const generatePersonReport = (person, loans, deposit = []) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
    doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
    doc.setFont('OpenSansHebrew');
    doc.setFontSize(12);

    const alignRight = { align: 'right' };

    const name = person.fullName;

    doc.setFontSize(18);
    doc.text(`דו"ח עבור ${name}`, 200, 22, alignRight);

    doc.setFontSize(12);
    doc.text(`ת.ז: ${person.id}`, 200, 32, alignRight);
    doc.text(`טלפון: ${person.phone}`, 200, 40, alignRight);
    doc.text(`כתובת: ${person.address}`, 200, 48, alignRight);
    doc.text(`אימייל: ${person.email}`, 200, 56, alignRight);
    doc.text(`הערות: ${person.notes || '-'}`, 200, 64, alignRight);

    // פעולות כספיות
    if (deposit.length > 0) {
        doc.text('רשימת פעולות כספיות:', 200, 74, alignRight);
        autoTable(doc, {
            startY: 80,
            headStyles: { halign: 'right' },
            bodyStyles: { halign: 'right' },
            styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
            head: [['סוג פעולה', 'סכום', 'יתרה לאחר הפעולה', 'תאריך', 'הערות']],
            body: deposit.map(d => [
                d.isDeposit ? 'הפקדה' : 'משיכה',
                `${formatAmount(d.amount,d.currency)}`,
                `${formatAmount(d.balanceAfter,d.currency)}`,
                new Date(d.createdAt || d.updatedAt || Date.now()).toLocaleDateString('he-IL'),
                d.notes || '-'
            ])
        });
    }

    // הלוואות + תשלומים לאותו עמוד
    if (loans.length > 0) {
        doc.addPage();
        doc.text('הלוואות ותשלומים:', 200, 22, alignRight);

        let currentY = 30;

        loans.forEach((loan) => {
            const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
            const balance = loan.amount - totalPaid;

            doc.setFontSize(12);
            doc.text(`הלוואה ${loan.id}`, 200, currentY, alignRight);
            doc.text(`סכום התחלתי: ${formatAmount(loan.amount, loan.currency)}`, 200, currentY + 8, alignRight);
            doc.text(`יתרה: ${formatAmount(balance,loan.currency)}`, 200, currentY + 16, alignRight);
            doc.text(`סכום לחודש: ${(formatAmount(loan.amountInMonth,loan.currency))}`, 200, currentY + 24, alignRight);
            doc.text(`כמות תשלומים: ${loan.amountOfPament || 'לא זמין'}`, 200, currentY + 32, alignRight);

            currentY += 40;

            // תשלומים לאותה הלוואה
            if (loan.repayments.length > 0) {
                autoTable(doc, {
                    startY: currentY,
                    headStyles: { halign: 'right' },
                    bodyStyles: { halign: 'right' },
                    styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
                    head: [['תאריך', 'סכום', 'אמצעי', 'הערות']],
                    body: loan.repayments.map(r => [
                        new Date(r.paidDate).toLocaleDateString('he-IL'),
                        `${formatAmount(r.amount,loan.currency)}`,
                        r.typeOfPayment === 'check' ? 'צ׳ק' : 'הוראת קבע',
                        r.notes || '-'
                    ]),
                    didDrawPage: (data) => {
                        currentY = data.cursor.y + 10; // המשך מיקום לאחר הטבלה
                    }
                });
            } else {
                currentY += 10;
            }
        });
    }

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
};
function fixMixedHeb(text) {
    const parts = text.split(':');
    if (parts.length === 2) {
        const [label, value] = parts;
        return `${value.trim()} :${label.trim()}`;
    }
    return text;
}

export const generateLoanReport = (loan) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
    doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
    doc.setFont('OpenSansHebrew');
    doc.setFontSize(12);

    const alignRight = { align: 'right' };

    const borrower = loan.borrower || {};

    doc.setFontSize(18);
    doc.text(`דו"ח עבור ההלוואה מספר ${loan.numOfLoan}`, 200, 22, alignRight);

    doc.setFontSize(12);
    doc.text(fixMixedHeb(`שם הלווה: ${borrower.fullName}`), 200, 32, alignRight);
    doc.text(fixMixedHeb(`ת.ז: ${borrower.id}`), 200, 40, alignRight);
    doc.text(fixMixedHeb(`טלפון: ${borrower.phone}`), 200, 48, alignRight);
    doc.text(fixMixedHeb(`כתובת: ${borrower.address}`), 200, 56, alignRight);
    doc.text(fixMixedHeb(`אימייל: ${borrower.email}`), 200, 64, alignRight);
    doc.text(fixMixedHeb(`הערות: ${borrower.notes || '-'}`), 200, 72, alignRight);

    doc.text(fixMixedHeb(`סכום ההלוואה: ${formatAmount(loan.amount,loan.currency)}`), 200, 84, alignRight);
    doc.text(fixMixedHeb(`סכום לחודש: ${formatAmount(loan.amountInMonth,loan.currency)}`), 200, 92, alignRight);
    doc.text(fixMixedHeb(`מספר תשלומים: ${loan.amountOfPament}`), 200, 100, alignRight);
    doc.text(fixMixedHeb(`תאריך התחלה: ${new Date(loan.startDate).toLocaleDateString('he-IL')}`), 200, 108, alignRight);
    doc.text(fixMixedHeb(`יום גבייה חודשי: ${loan.repaymentDay}`), 200, 116, alignRight);
    doc.text(fixMixedHeb(`סטטוס: ${loan.status}`), 200, 124, alignRight);
    doc.text(fixMixedHeb(`הערות להלוואה: ${loan.notes || '-'}`), 200, 132, alignRight);

    // טבלת תשלומים
    const repayments = loan.repayments || [];
    if (repayments.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('טבלת תשלומים:', 200, 22, alignRight);
        autoTable(doc, {
            startY: 28,
            headStyles: { halign: 'right' },
            bodyStyles: { halign: 'right' },
            styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
            head: [[
                fixMixedHeb('תאריך'),
                fixMixedHeb('סכום'),
                fixMixedHeb('אמצעי תשלום'),
                fixMixedHeb('הערות')
            ]],
            body: repayments.map(r => [
                fixMixedHeb(new Date(r.paidDate).toLocaleDateString('he-IL')),
                fixMixedHeb(`${formatAmount(r.amount,r.currency)}`),
                fixMixedHeb(r.typeOfPayment === 'check' ? 'צ׳ק' : 'הוראת קבע'),
                fixMixedHeb(r.notes || '-')
            ])
        });
    }

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
};
export const generateMovmentReport = (movment = []) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
  doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
  doc.setFont('OpenSansHebrew');
  doc.setFontSize(12);

  const alignRight = { align: 'right' };

  doc.setFontSize(18);
  doc.text('דו"ח תנועות כספיות', 200, 22, alignRight);

  // טבלת תנועות
  if (movment.length > 0) {
    autoTable(doc, {
      startY: 30,
      headStyles: { halign: 'right' },
      bodyStyles: { halign: 'right' },
      styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
      head: [[
        fixMixedHeb('מספר תנועה'),
        fixMixedHeb('סוג פעולה'),
        fixMixedHeb('סכום'),
        fixMixedHeb('תיאור'),
        fixMixedHeb('תאריך')
      ]],
      body: movment.map(m => [
        m.id,
        translateMovmemntType(m.type),
        `${formatAmount(m.amount,m.currency)}`,
        m.description || '-',
        m.createdAt
          ? new Date(m.createdAt).toLocaleDateString('he-IL')
          : '-'
      ])
    });
  } else {
    doc.text('לא נמצאו תנועות.', 200, 30, alignRight);
  }

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

function translateMovmemntType(MovmemntType) {
        console.log(MovmemntType)
        const statusMap = {
            repayment_received: 'תשלום על הלוואה',
            loan_given: 'הלוואה',
            deposit: 'הפקדה',
            deposit_pull: 'משיכה',
            donation: 'תרומה',
            manual_adjustment: 'הפקדת מנהל',
        };

        return statusMap[MovmemntType] || 'לא ידוע';
    }

export const generateDepositReport = (deposit, balancePreson, history = []) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // הטמעת גופן עברי
  doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
  doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
  doc.setFont('OpenSansHebrew');
  doc.setFontSize(12);
  const alignRight = { align: 'right' };

  const personName = deposit.fullName || (deposit.person?.fullName || '---');
  const tz = deposit.PeopleId || deposit.personId || '---';

  doc.setFontSize(18);
  doc.text(`קבלה על הפקדה`, 200, 20, alignRight);

  doc.setFontSize(12);
  doc.text(`שם: ${personName}`, 200, 30, alignRight);
  doc.text(`ת.ז: ${tz}`, 200, 36, alignRight);
  doc.text(`תאריך: ${new Date(deposit.date).toLocaleDateString('he-IL')}`, 200, 42, alignRight);

  doc.text(`אמצעי תשלום: ${deposit.typeOfPayment === 'check' ? 'צ׳ק' : 'מזומן/העברה'}`, 200, 52, alignRight);
  doc.text(`סכום ההפקדה: ${formatAmount(deposit.amount,deposit.currency)}`, 200, 58, alignRight);
  doc.text(`יתרה לאחר ההפקדה: ${formatAmount(balancePreson,deposit.currency)}`, 200, 64, alignRight);
  doc.text(`הערות: ${deposit.description || '-'}`, 200, 70, alignRight);

  if (history.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('היסטוריית הפקדות ומשיכות:', 200, 20, alignRight);

    autoTable(doc, {
      startY: 28,
      headStyles: { halign: 'right' },
      bodyStyles: { halign: 'right' },
      styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
      head: [[
        'סוג פעולה',
        'סכום',
        'יתרה לאחר פעולה',
        'תאריך',
        'הערות'
      ]],
      body: history.map(entry => [
        entry.isDeposit ? 'הפקדה' : 'משיכה',
        `${formatAmount(entry.amount,entry.currency)}`,
        `${formatAmount(entry.balanceAfter || 0,entry.currency)}`,
        new Date(entry.date || entry.createdAt || entry.updatedAt).toLocaleDateString('he-IL'),
        entry.description || entry.notes || '-'
      ])
    });
  }

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

export const generateDonationReport = (movement, person) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
  doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
  doc.setFont('OpenSansHebrew');
  doc.setFontSize(12);
  const alignRight = { align: 'right' };

  const fullName = person?.fullName || '---';
  const id = person?.id || movement?.personId || '---';
  const date = new Date(movement.date).toLocaleDateString('he-IL');
  const amount = Number(movement.amount?.toString().replace(/,/g, '') || 0).toLocaleString();
  const description = movement.description || '-';

  doc.setFontSize(18);
  doc.text('קבלה על תרומה', 200, 22, alignRight);

  doc.setFontSize(12);
  doc.text(`שם התורם: ${fullName}`, 200, 32, alignRight);
  doc.text(`ת.ז: ${id}`, 200, 38, alignRight);

  doc.text(`תאריך התרומה: ${date}`, 200, 48, alignRight);
  doc.text(`סכום התרומה: ${formatAmount(amount,movement.currency)}`, 200, 54, alignRight);
  doc.text(`תיאור: ${description}`, 200, 60, alignRight);

  doc.setFontSize(14);
  doc.setTextColor(40, 100, 40);
  doc.text('תודה רבה על תרומתך הנדיבה!', 200, 80, alignRight);

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
