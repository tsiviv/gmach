import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fontBase64 from './embedded_font_example';
import { formatAmountPdf, format, convertToHebrewDate } from './helper';

const title = localStorage.getItem('siteTitle')
const RLE = '\u202B';
const LRM = "\u200E";
const PDF = '\u202C';
const token = sessionStorage.getItem('token');

function reverseText(text) {
    const isEnglish = /^[\u0000-\u007F\s.,!?'"()\[\]{}\-:/\\@#$%^&*+=<>|~`]*$/.test(text);
    return isEnglish ? text : text.split('').reverse().join('');
}

const paymentMethodText = {
    chash: 'מזומן',
    check: 'צ׳ק',
    Standing_order: 'הוראת קבע',
};

function translateLoanStatus(status) {
    const statusMap = {
        pending: 'פעילה',
        partial: 'שולמה חלקית',
        paid: 'שולמה',
        overdue: ' פיגור בתשלום',
        late_paid: 'שולמה באיחור',
        PaidBy_Gauartantor: 'שולמה על ידי ערב',
    };

    return statusMap[status] || 'לא ידוע';
}

export const generatePersonReport = (person, loans, deposit = []) => {
    const logo = new Image();
    logo.src = `http://localhost:4000/uploads/logo.png?token=${token}`;

    return new Promise((resolve) => {
        const createDoc = (withLogo) => {
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

            doc.setFontSize(20);
            doc.text(reverseText(title), 105, 10, { align: 'center' });

            if (withLogo) {
                const pageWidth = doc.internal.pageSize.getWidth();
                const maxWidth = 40;
                const maxHeight = 20;

                const ratio = logo.width / logo.height;
                let width = maxWidth;
                let height = maxWidth / ratio;

                if (height > maxHeight) {
                    height = maxHeight;
                    width = maxHeight * ratio;
                }

                doc.addImage(logo, 'PNG', 10, 15, width, height);
            }

            doc.setFontSize(18);
            doc.text(reverseText(' דו"ח עבור:'), 200, 40, alignRight);
            doc.text(reverseText(name || '-'), 170, 40, alignRight);

            doc.setFontSize(12);
            doc.text(`${LRM}${person.id} :ת.ז`, 200, 48, alignRight);
            doc.text(`${LRM}${person.phone} :טלפון`, 200, 56, alignRight);
            doc.text(`${reverseText(person.address || '-')} ${reverseText('כתובת:')}`, 200, 64, alignRight);
            doc.text(`${LRM}${person.email || '-'} :אימייל`, 200, 72, alignRight);
            doc.text(reverseText('הערות:', person.notes), 200, 80, alignRight);

            let currentY = 90;

            if (deposit.length > 0) {
                doc.text(reverseText('רשימת פעולות כספיות:'), 200, currentY, alignRight);
                currentY += 6;

                autoTable(doc, {
                    startY: currentY,
                    headStyles: { halign: 'right' },
                    bodyStyles: { halign: 'right' },
                    styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
                    head: [[
                        reverseText('סוג פעולה'),
                        reverseText('סכום'),
                        reverseText('יתרה לאחר הפעולה'),
                        reverseText('תאריך'),
                        reverseText('תאריך עברי'),
                        reverseText('הערות')
                    ]],
                    body: deposit.map(d => [
                        reverseText(d.isDeposit ? 'הפקדה' : 'משיכה'),
                        formatAmountPdf(d.amount, d.currency),
                        formatAmountPdf(d.balanceAfter, d.currency),
                        new Date(d.createdAt || d.updatedAt || Date.now()).toLocaleDateString('he-IL'),
                        reverseText(convertToHebrewDate(new Date(d.createdAt || d.updatedAt || Date.now()))),
                        d.notes ? reverseText(d.notes) : '-'
                    ])
                });
            }

            if (loans.length > 0) {
                doc.addPage();
                doc.text(reverseText('הלוואות ותשלומים'), 200, 22, alignRight);

                let currentY = 30;

                loans.forEach((loan) => {
                    const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
                    const balance = loan.amount - totalPaid;

                    doc.setFontSize(12);
                    doc.text(`#${loan.id} ${reverseText('הלוואה')}`, 200, currentY, alignRight);
                    doc.text(`${LRM}${formatAmountPdf(loan.amount, loan.currency)} :סכום התחלתי`, 200, currentY + 8, alignRight);
                    doc.text(`${LRM}${formatAmountPdf(balance, loan.currency)} :יתרה`, 200, currentY + 16, alignRight);
                    doc.text(`${LRM}${formatAmountPdf(loan.amountInMonth, loan.currency)} :סכום לחודש`, 200, currentY + 24, alignRight);
                    doc.text(`${LRM}${loan.amountOfPament || 'לא זמין'} :כמות תשלומים`, 200, currentY + 32, alignRight);

                    currentY += 40;

                    if (loan.repayments.length > 0) {
                        autoTable(doc, {
                            startY: currentY,
                            headStyles: { halign: 'right' },
                            bodyStyles: { halign: 'right' },
                            styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
                            head: [[
                                reverseText('תאריך'),
                                reverseText('תאריך עברי'),
                                reverseText('סכום'),
                                reverseText('אמצעי'),
                                reverseText('הערות')
                            ]],
                            body: loan.repayments.map(r => [
                                new Date(r.paidDate).toLocaleDateString('he-IL'),
                                reverseText(convertToHebrewDate(new Date(r.paidDate))),
                                `${formatAmountPdf(r.amount, loan.currency)}`,
                                reverseText(r.typeOfPayment === 'check' ? 'צ׳ק' : 'הוראת קבע'),
                                reverseText(r.notes || '-')
                            ]),
                            didDrawPage: (data) => {
                                currentY = data.cursor.y + 10;
                            }
                        });
                    } else {
                        currentY += 10;
                    }
                });
            }

            const blob = doc.output('blob');
            resolve(URL.createObjectURL(blob));
        };

        logo.onload = () => createDoc(true);
        logo.onerror = () => createDoc(false);
    });
};



export const generateLoanReport = (loan) => {
    return new Promise((resolve) => {
        const logo = new Image();
        logo.src = `http://localhost:4000/uploads/logo.png?token=${token}`;

        const createDoc = (withLogo) => {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
            doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
            doc.setFont('OpenSansHebrew');
            doc.setFontSize(20);
            doc.text(reverseText(title), 105, 10, { align: 'center' });

            const alignRight = { align: 'right' };
            const borrower = loan.borrower || {};

            if (withLogo) {
                const pageWidth = doc.internal.pageSize.getWidth();
                const maxWidth = 40;
                const maxHeight = 20;

                const ratio = logo.width / logo.height;

                let width = maxWidth;
                let height = maxWidth / ratio;

                if (height > maxHeight) {
                    height = maxHeight;
                    width = maxHeight * ratio;
                }
                doc.addImage(logo, 'PNG', 10, 10, width, height);
            }


            doc.setFontSize(18);
            doc.text(reverseText(`דו"ח עבור ההלוואה מספר ${loan.numOfLoan}`), 200, 22, alignRight);
            doc.setFontSize(12);
            doc.text(reverseText('שם הלווה:'), 200, 32, alignRight);
            doc.text(reverseText(borrower.fullName || '-'), 180, 32, alignRight);
            doc.text(reverseText(`ת.ז: ${borrower.id}`), 200, 38, alignRight);
            doc.text(reverseText(`טלפון: ${borrower.phone}`), 200, 44, alignRight);
            doc.text(`${reverseText(borrower.address || '-')} ${reverseText('כתובת:')}`, 200, 50, alignRight);
            doc.text(`${LRM}${borrower.email || '-'} :אימייל`, 200, 56, alignRight);
            doc.text(`${reverseText('הערות:')} ${reverseText(borrower.notes || '-')}`, 200, 72, alignRight);
            doc.text(reverseText(`סכום ההלוואה: ${formatAmountPdf(loan.amount, loan.currency)}`), 200, 84, alignRight);
            doc.text(reverseText(`סכום לחודש: ${formatAmountPdf(loan.amountInMonth, loan.currency)}`), 200, 92, alignRight);
            doc.text(reverseText(`מספר תשלומים: ${loan.amountOfPament}`), 200, 100, alignRight);
            doc.text(reverseText(`תאריך התחלה: ${new Date(loan.startDate).toLocaleDateString('he-IL')}`), 200, 108, alignRight);
            doc.text(reverseText(`תאריך התחלה עברי:  ${convertToHebrewDate(new Date(loan.startDate))}`), 200, 112, alignRight);
            doc.text(reverseText(`יום גבייה חודשי: ${loan.repaymentDay}`), 200, 116, alignRight);
            doc.text(reverseText(`סטטוס: ${translateLoanStatus(loan.status)}`), 200, 124, alignRight);
            doc.text(reverseText(`הערות להלוואה: ${loan.notes || '-'}`), 200, 132, alignRight);

            const repayments = loan.repayments || [];
            if (repayments.length > 0) {
                doc.setFontSize(14);
                doc.text(reverseText('טבלת תשלומים'), 200, 140, alignRight);

                autoTable(doc, {
                    startY: 146,
                    pageBreak: 'avoid',
                    headStyles: { halign: 'right' },
                    bodyStyles: { halign: 'right' },
                    styles: {
                        font: 'OpenSansHebrew',
                        fontStyle: 'normal',
                        fontSize: 9,
                    },
                    head: [[
                        reverseText('תאריך'),
                        reverseText('סכום'),
                        reverseText('אמצעי תשלום'),
                        reverseText('הערות')
                    ]],
                    body: repayments.map(r => [
                        new Date(r.paidDate).toLocaleDateString('he-IL'),
                        `${formatAmountPdf(r.amount, r.currency)}`,
                        reverseText(r.typeOfPayment === 'check' ? 'צ׳ק' : 'הוראת קבע'),
                        reverseText(r.notes || '-')
                    ])
                });
            }

            const blob = doc.output('blob');
            resolve(URL.createObjectURL(blob));
        };

        logo.onload = () => createDoc(true);
        logo.onerror = () => createDoc(false);
    });
};

export const generateMovmentReport = (movment = []) => {
    return new Promise((resolve) => {
        const logo = new Image();
        logo.src = `http://localhost:4000/uploads/logo.png?token=${token}`;

        const createDoc = (withLogo) => {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
            doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
            doc.setFont('OpenSansHebrew');
            doc.setFontSize(20);
            doc.text(reverseText(title), 105, 10, { align: 'center' });

            const alignRight = { align: 'right' };

            if (withLogo) {
                const pageWidth = doc.internal.pageSize.getWidth();
                const maxWidth = 40; // רוחב מקסימלי לתמונה
                const maxHeight = 20; // גובה מקסימלי לתמונה

                const ratio = logo.width / logo.height;

                let width = maxWidth;
                let height = maxWidth / ratio;

                if (height > maxHeight) {
                    height = maxHeight;
                    width = maxHeight * ratio;
                }
                doc.addImage(logo, 'PNG', 10, 10, width, height);
            }

            doc.setFontSize(18);
            doc.text(reverseText('דו"ח תנועות כספיות'), 200, 22, alignRight);

            if (movment.length > 0) {
                autoTable(doc, {
                    startY: 30,
                    headStyles: { halign: 'right' },
                    bodyStyles: { halign: 'right' },
                    styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
                    head: [[
                        reverseText('מספר תנועה'),
                        reverseText('סוג פעולה'),
                        reverseText('סכום'),
                        reverseText('תיאור'),
                        reverseText('תאריך'),
                        reverseText('תאריך עברי')
                    ]],
                    body: movment.map(m => [
                        m.id,
                        reverseText(translateMovmemntType(m.type)),
                        `${reverseText(formatAmountPdf(m.amount, m.currency))}`,
                        reverseText(m.description || '-'),
                        m.date ? new Date(m.date).toLocaleDateString('he-IL') : '-',
                        m.date && reverseText(convertToHebrewDate(new Date(m.date)))
                    ])
                });
            } else {
                doc.text('לא נמצאו תנועות.', 200, 30, alignRight);
            }

            const blob = doc.output('blob');
            resolve(URL.createObjectURL(blob));
        };

        logo.onload = () => createDoc(true);
        logo.onerror = () => createDoc(false);
    });
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

export const generateDepositReport = (deposit, person, balancePreson, history = []) => {
    console.log(deposit, history)
    const logo = new Image();
    logo.src = `http://localhost:4000/uploads/logo.png?token=${token}`;

    return new Promise((resolve) => {
        const createDoc = (withLogo = false) => {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
            doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
            doc.setFont('OpenSansHebrew');
            doc.setFontSize(20);
            doc.text(reverseText(title), 105, 10, { align: 'center' });

            const alignRight = { align: 'right' };
            const personName = person?.fullName || '---';
            const tz = deposit.PeopleId || '---';

            if (withLogo) {
                const pageWidth = doc.internal.pageSize.getWidth();
                const maxWidth = 40; // רוחב מקסימלי לתמונה
                const maxHeight = 20; // גובה מקסימלי לתמונה

                const ratio = logo.width / logo.height;

                let width = maxWidth;
                let height = maxWidth / ratio;

                if (height > maxHeight) {
                    height = maxHeight;
                    width = maxHeight * ratio;
                }
                doc.addImage(logo, 'PNG', 10, 10, width, height);
            }

            const paymentText = paymentMethodText[deposit.typeOfPayment] || 'לא ידוע';
            doc.setFontSize(18);
            doc.text(`${reverseText('קבלה על הפקדה')}`, 200, 22, alignRight);

            doc.setFontSize(12);
            doc.text(reverseText('שם:'), 200, 30, { align: 'right' });
            doc.text(reverseText(personName), 180, 30, { align: 'right' });
            doc.text(reverseText('תאריך:'), 200, 37, { align: 'right' });
            doc.text(new Date(deposit.date).toLocaleDateString('he-IL'), 180, 37, { align: 'right' });
            doc.text(reverseText('תאריך עברי: '), 200, 42, { align: 'right' });
            doc.text(reverseText(convertToHebrewDate(new Date(deposit.date))), 180, 42, { align: 'right' });
            doc.text(`${RLE}${reverseText(paymentText)}${reverseText('אמצעי תשלום:')} ${PDF}`, 200, 50, alignRight);
            doc.text(`${RLE}${reverseText(formatAmountPdf(deposit.amount, deposit.currency))} ${reverseText('סכום ההפקדה:')} ${PDF}`, 200, 58, alignRight);
            doc.text(`${RLE}${reverseText(formatAmountPdf(balancePreson, deposit.currency))}${reverseText('יתרה לאחר ההפקדה:')}${PDF}`, 200, 64, alignRight);
            doc.text(reverseText('הערות:'), 200, 70, { align: 'right' });
            doc.text(reverseText(deposit.description || '-'), 180, 70, { align: 'right' });

            if (history.length > 0) {
                doc.addPage();
                doc.setFontSize(16);
                doc.text(`${reverseText('הסטוריית משיכות והפקדות')}`, 200, 22, alignRight);

                autoTable(doc, {
                    startY: 28,
                    headStyles: { halign: 'right' },
                    bodyStyles: { halign: 'right' },
                    styles: { font: 'OpenSansHebrew', fontStyle: 'normal' },
                    head: [[
                        reverseText('סוג פעולה'),
                        reverseText('סכום'),
                        reverseText('יתרה לאחר פעולה'),
                        reverseText('תאריך'),
                        reverseText('תאריך עברי'),
                        reverseText('הערות')
                    ]],
                    body: history.map(entry => [
                        reverseText(entry.isDeposit ? 'הפקדה' : 'משיכה'),
                        `${formatAmountPdf(entry.amount, entry.currency)}`,
                        `${formatAmountPdf(entry.balanceAfter || 0, entry.currency)}`,
                        new Date(entry.date || entry.createdAt || entry.updatedAt).toLocaleDateString('he-IL'),
                        reverseText(convertToHebrewDate(new Date(entry.date || entry.createdAt || entry.updatedAt))),
                        reverseText(entry.description || entry.notes || '-')
                    ])
                });
            }

            const blob = doc.output('blob');
            resolve(URL.createObjectURL(blob));
        };

        logo.onload = () => createDoc(true);
        logo.onerror = () => createDoc(false);
    });
};



export const generateDonationReport = (movement, person) => {
    return new Promise((resolve) => {
        const logo = new Image();
        logo.src = `http://localhost:4000/uploads/logo.png?token=${token}`;

        const createDoc = (withLogo = false) => {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            doc.addFileToVFS('OpenSansHebrew-Regular.ttf', fontBase64);
            doc.addFont('OpenSansHebrew-Regular.ttf', 'OpenSansHebrew', 'normal');
            doc.setFont('OpenSansHebrew');
            doc.setFontSize(20);
            doc.text(reverseText(title), 105, 10, { align: 'center' });

            const alignRight = { align: 'right' };
            const fullName = person?.fullName || '---';
            const id = person?.id || movement?.personId || '---';
            const date = new Date(movement.date).toLocaleDateString('he-IL');
            const description = movement.description || '-';

            if (withLogo) {
                const pageWidth = doc.internal.pageSize.getWidth();
                const maxWidth = 40; // רוחב מקסימלי לתמונה
                const maxHeight = 20; // גובה מקסימלי לתמונה

                const ratio = logo.width / logo.height;

                let width = maxWidth;
                let height = maxWidth / ratio;

                if (height > maxHeight) {
                    height = maxHeight;
                    width = maxHeight * ratio;
                }
                doc.addImage(logo, 'PNG', 10, 10, width, height);
            }


            doc.setFontSize(18);
            doc.text(`${reverseText(' קבלה על תרומה')}`, 200, 22, alignRight);

            doc.setFontSize(12);
            doc.text(reverseText('שם התורם:'), 200, 32, alignRight);
            doc.text(reverseText(fullName), 180, 32, alignRight);
            doc.text(reverseText(`ת.ז: ${id}`), 200, 38, alignRight);
            doc.text(reverseText(`תאריך התרומה: ${date}`), 200, 48, alignRight);
            doc.text(reverseText(`סכום התרומה: ${formatAmountPdf(movement.amount.replace(/,/g, ''), movement.currency)}`), 200, 54, alignRight);
            doc.text(reverseText('תאור:'), 200, 60, alignRight);
            doc.text(reverseText(description), 180, 60, alignRight);

            doc.setFontSize(14);
            doc.setTextColor(40, 100, 40);
            doc.text(reverseText('תודה רבה על תרומתך הנדיבה'), 200, 80, alignRight);

            const blob = doc.output('blob');
            resolve(URL.createObjectURL(blob));
        };

        logo.onload = () => createDoc(true);
        logo.onerror = () => createDoc(false);
    });
};
