import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { CreateLoan, GetAllLoans, GetLoanById, DeleteLoan, UpdateLoan, GetLoanStatusSummary } from "../servieces/Loans";
import { GetPersonById, CreatePerson } from "../servieces/People";
import Table from 'react-bootstrap/Table';
import DocumentModal from "./DocumentModel";
import { FaEdit, FaTrash } from 'react-icons/fa';
import ModelNewPerson from "./ModelNewPerson";
import { useNavigate } from 'react-router-dom';
import { formatAmount, format } from './helper'
import { generateLoanReport } from './GenerateReport';

export default function Loans() {
    const [loans, setLoans] = useState([]);
    const [loansMan, setloansMan] = useState([]);
    const [newLoan, setNewLoan] = useState({
        numOfLoan: '',
        borrowerId: '',
        amount: '',
        startDate: '',
        repaymentType: 'monthly',
        repaymentDay: '',
        singleRepaymentDate: '',
        amountInMonth: '',
        amountOfPament: '',
        typeOfPayment: 'check',
        currency: 'shekel',
        notes: '',
        documentPath: null,
        guarantors: []
    });
      const [formKey, setFormKey] = useState(Date.now()); // 👈 מפתח לטופס
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('he-IL');
    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();
    const [render, setrender] = useState(false)
    const [isEdit, setisEdit] = useState(false);
    const [IdUpdate, setidUpdate] = useState('')
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [error, setError] = useState("");
    const [showLoanModal, setShowLoanModal] = useState(false); // שליטה על מודל ההלוואה
    const [openRowId, setOpenRowId] = useState(null);
    const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [pdfVisible, setPdfVisible] = useState(false);
    const [openLoanId, setOpenLoanId] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(50); // מספר רשומות לדף
    const filteredLonas = loans?.filter((loan) => {
        if (!selectedFilter) return true;

        if (selectedFilter === 'borrowerId') {
            return loan.borrowerId.toString().includes(filterValue);
        }

        if (selectedFilter === 'name') {
            return loan.borrower.fullName.toLowerCase().includes(filterValue);
        }
        if (selectedFilter === 'status') {
            return loan.status.toLowerCase().includes(filterValue.toLowerCase());
        }

        if (selectedFilter === 'date') {
            const fromDate2 = fromDate ? new Date(fromDate) : null;
            if (!fromDate2) return true; // אין תאריך לסינון

            if (!(loan.repaymentDay == 'null')) {
                const fromDay = fromDate2.getDate();
                return loan.repaymentDay === fromDay;
            } else {
                const paidDate = new Date(loan.singleRepaymentDate);
                return (
                    paidDate.getFullYear() === fromDate2.getFullYear() &&
                    paidDate.getMonth() === fromDate2.getMonth() &&
                    paidDate.getDate() === fromDate2.getDate()
                );
            }
        }



        if (selectedFilter === 'amount') {
            const amount = Number(loan.amount);
            const min = Number(minAmount) || 0;
            const max = Number(maxAmount) || Infinity;
            return amount >= min && amount <= max;
        }

        return true;
    });
    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, ''); // הסרת פסיקים
        if (!/^\d*$/.test(rawValue)) return; // חסום תווים לא מספריים

        const numericValue = Number(rawValue);
        const formattedValue = format(numericValue);
        setNewLoan((prev) => ({
            ...prev,
            amount: formattedValue,
        }));
    };
    const countAmountLeft = (loan) => {
        console.log("loan",loan)
        let total = loan.amount
        loan.repayments.forEach(element => {
            console.log("element",element)
            total -= element.amount
        });
        return total
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'orange';
            case 'partial':
                return 'deepskyblue';
            case 'paid':
                return 'green';
            case 'overdue':
                return 'red';
            case 'late_paid':
                return 'tomato';
            case 'PaidBy_Gauartantor':
                return 'purple';
            default:
                return 'gray';
        }
    };
    const handleAddGuarantor = () => {
        const lastGuarantor = newLoan.guarantors?.[newLoan.guarantors.length - 1];
        if (!lastGuarantor || lastGuarantor.PeopleId.trim()) {
            setNewLoan((prev) => ({
                ...prev,
                guarantors: [...(prev.guarantors || []), { PeopleId: "" }],
            }));
        } else {
            alert("יש למלא תעודת זהות לפני שמוסיפים ערב נוסף");
        }
    };


    const toggleRow = async (id) => {
        try {
            const res = await GetLoanById(id);
            setloansMan(res);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            } else {
                console.log(err);
            }
        }
        setOpenRowId(openRowId === id ? null : id)
    };

    async function fetchData() {
        try {
            const allLoans = await GetAllLoans(currentPage, pageSize);
            console.log(allLoans)
            setLoans(allLoans.data);
            setTotalPages(allLoans.totalPages);
            console.log(allLoans)
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            } setError("שגיאה בטעינת נתונים");
        }
    }

    useEffect(() => {
        fetchData();
    }, [ , currentPage]);

    const handleLoanChange = (e) => {
        const { name, value } = e.target;
        setNewLoan({ ...newLoan, [name]: value });
    };
    const handleIdBlurGuarantor = async (id, index) => {
        if (id == newLoan.borrowerId) {
            alert('תעודת זהות של הערב היא תעודת זהות של הלווה')
            const updated = [...newLoan.guarantors];
            updated[index] = { ...updated[index], PeopleId: '' };
            setNewLoan({ ...newLoan, guarantors: updated });
        }

        try {
            const existingPerson = await GetPersonById(id);
            if (!existingPerson) {
                setShowAddPersonModal(true);
                const updated = [...newLoan.guarantors];
                updated[index] = { ...updated[index], PeopleId: '' };
                setNewLoan({ ...newLoan, guarantors: updated });
            }
            else {
                const res = await GetLoanStatusSummary(id)
                const issues = [];
                if (res.guarantorCount > 0) {
                    issues.push(`משתמש זה משמש כערב ב-${res.guarantorCount} הלוואות.`);
                }
                if (res.borrower.overdue.length > 0) {
                    issues.push('למשתמש זה יש הלוואה שפג תוקפה ולא שולמה או שולמה חלקית(איחור חריג).');
                }

                if (res.borrower.late_paid.length > 0) {
                    issues.push('למשתמש זה יש הלוואה ששולמה באיחור.');
                }

                if (res.borrower.PaidBy_Gauartantor.length > 0) {
                    issues.push('למשתמש זה יש הלוואות ששולמו ע"י ערב אחר.');
                }

                if (res.guarantor.overdue.length > 0) {
                    issues.push('המשתמש משמש כערב בהלוואה שפג תוקפה ולא שולמה.');
                }
                if (issues.length > 0) {
                    alert('אזהרה:\n\n' + issues.join('\n'));
                }
            }
        }
        catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
        }
    }
    const handleIdBlur = async (id) => {
        try {
            const existingPerson = await GetPersonById(id);
            if (!existingPerson) {
                setShowAddPersonModal(true);
                setNewLoan({ ...newLoan, ['borrowerId']: '' });
            }
            else {
                const issues = [];
                const res = await GetLoanStatusSummary(id)
                if (res.borrower.pendingOrPartial.length != 0) {
                    alert('למשתמש זה יש כבר הלוואה שעדיין פעילה')
                    return
                }

                if (res.borrower.overdue.length > 0) {
                    issues.push('למשתמש זה יש הלוואה שפג תוקפה ולא שולמה או שולמה חלקית(איחור חריג).');
                }

                if (res.borrower.late_paid.length > 0) {
                    issues.push('למשתמש זה יש הלוואה ששולמה באיחור.');
                }

                if (res.borrower.PaidBy_Gauartantor.length > 0) {
                    issues.push('למשתמש זה יש הלוואות ששולמו ע"י ערב אחר.');
                }

                if (res.guarantorCount > 0) {
                    issues.push(`משתמש זה משמש כערב ב-${res.guarantorCount} הלוואות.`);
                }

                if (res.guarantor.overdue.length > 0) {
                    issues.push('המשתמש משמש כערב בהלוואה שפג תוקפה ולא שולמה.');
                }

                if (issues.length > 0) {
                    alert('אזהרה:\n\n' + issues.join('\n'));
                }
            }
        }
        catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.log(err)
        }
    }
    const handleShowPdf = async (loan) => {
        const container = document.getElementById('pdf-container');

        if (pdfVisible) {
            container.innerHTML = '';
            setPdfVisible(false);
        } else {
            const url = await generateLoanReport(loan);
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.width = '100%';
            iframe.height = '600px';
            iframe.style.border = 'none';

            container.innerHTML = '';
            container.appendChild(iframe);
            setPdfVisible(true);
        }
    };


    const handleSubmit = async (e) => {
        console.log("newLoan", newLoan)
        e.preventDefault();
        try {
            isEdit ? await UpdateLoan(IdUpdate, newLoan.numOfLoan, newLoan.borrowerId, newLoan.amount.replace(/,/g, ''), newLoan.startDate, newLoan.notes, newLoan.repaymentType, newLoan.repaymentType == 'monthly' ? newLoan.repaymentDay : null, newLoan.repaymentType == 'monthly' ? null : newLoan.singleRepaymentDate, newLoan.repaymentType == 'monthly' ? newLoan.amountInMonth : null, newLoan.guarantors, newLoan.documentPath, newLoan.typeOfPayment,
                newLoan.currency, newLoan.amountOfPament) :
                await CreateLoan(newLoan.numOfLoan, newLoan.borrowerId, newLoan.amount.replace(/,/g, ''), newLoan.startDate, newLoan.notes, newLoan.repaymentType, newLoan.repaymentType == 'monthly' ? newLoan.repaymentDay : null, newLoan.repaymentType == 'monthly' ? null : newLoan.singleRepaymentDate, newLoan.repaymentType == 'monthly' ? newLoan.amountInMonth : null, newLoan.guarantors, newLoan.documentPath, newLoan.typeOfPayment,
                    newLoan.currency, newLoan.amountOfPament)
            setShowLoanModal(false);
            navigate('/people', { state: { openPersonId: newLoan.borrowerId } });
            setError('')
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            } setError(err?.response?.data);
        }
    };

    const update = async (LoanToUpdate) => {
        setidUpdate(LoanToUpdate.id)
        let res
        try {
            res = await GetLoanById(LoanToUpdate.id);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            } else {
                console.log(err);
            }
        } setNewLoan({
            borrowerId: LoanToUpdate.borrowerId,
            amount: format(LoanToUpdate.amount),
            startDate: LoanToUpdate.startDate,
            notes: LoanToUpdate.notes,
            repaymentType: LoanToUpdate.repaymentType,
            repaymentDay: LoanToUpdate.repaymentDay,
            singleRepaymentDate: LoanToUpdate.singleRepaymentDate,
            amountInMonth: LoanToUpdate.amountInMonth,
            documentPath: LoanToUpdate.documentPath,
            numOfLoan: LoanToUpdate.numOfLoan,
            guarantors: res.guarantors,
            currency: LoanToUpdate.currency,
            typeOfPayment: LoanToUpdate.typeOfPayment,
            amountOfPament: LoanToUpdate.amountOfPament
        })
        setisEdit(true)
        setShowLoanModal(true)
    }
    const Deleteloan = async (id) => {
        try {
            const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק את ההלוואה ?");
            if (!confirmDelete) return;

            const res = await DeleteLoan(id);
            fetchData()
            setError('');
        } catch (err) {
            setError(err.response?.data || 'שגיאה לא צפויה');
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            } else {
                console.log(err);
            }
        }
    };
    function formatDateToReadable(dateString) {
        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year} `;
    }


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
    function translaterepaymentType(repaymentType) {
        const statusMap = {
            monthly: 'חודשי',
            once: 'חד פעמי',
        };

        return statusMap[repaymentType] || 'לא ידוע';
    }

    const handleclose = () => {
        setFormKey(Date.now());
        setShowLoanModal(false)
        setisEdit(false)
        fetchData()
    }
    const translateMethod = (method) => {
        switch (method) {
            case 'check': return "צ'ק";
            case 'Standing_order': return 'הוראת קבע';
            case 'cash': return 'מזומן';
            default: return method;
        }
    };
    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const openShowLoanModal = () => {
        setFormKey(Date.now());
        setisEdit(false);
        setNewLoan({
            numOfLoan: '',
            borrowerId: '',
            amount: '',
            startDate: '',
            repaymentType: 'monthly',
            repaymentDay: '',
            singleRepaymentDate: '',
            amountInMonth: '',
            amountOfPament: '',
            typeOfPayment: 'check',
            currency: 'shekel',
            notes: '',
            documentPath: null,
            guarantors: []
        });
        setShowLoanModal(true); // פותח אחרי שה-state עודכן
    };

    const openModal = (path) => {
        setSelectedPdfUrl(`http://localhost:4000/uploads/${path}?token=${token}`);
        setShowModal(true);
    };
    return (
        <div className="container pt-5">
            <div className="d-flex justify-content-start mb-3">
                <Button variant="warning"
                    className="mb-3 ms-5" onClick={() => openShowLoanModal()}>הוסף הלוואה</Button>
                <Form className="mb-3 ">
                    <div className="row align-items-end">
                        <div className="col">
                            <Form.Label>בחר שדה לסינון:</Form.Label>
                            <Form.Select
                                value={selectedFilter}
                                onChange={(e) => {
                                    setSelectedFilter(e.target.value);
                                    setFilterValue('');
                                    setFromDate('');
                                }}
                            >
                                <option value="">-- אין סינון --</option>
                                <option value="borrowerId">תעודת זהות</option>
                                <option value="name">שם הלווה</option>
                                <option value="date">תאריך תשלום</option>
                                <option value="amount">טווח סכום תשלום  </option>
                                <option value="status">סטטוס</option>
                            </Form.Select>
                        </div>

                        {selectedFilter === 'status' ? (
                            <div className="col">
                                <Form.Label>הזן ערך לסינון:</Form.Label>
                                <Form.Select
                                    value={filterValue}
                                    onChange={(e) => {
                                        setFilterValue(e.target.value);
                                    }}
                                >
                                    <option value="pending"> פעילה</option>
                                    <option value="partial"> שולמה חלקית</option>
                                    <option value="paid">שולמה </option>
                                    <option value="overdue"> פיגור בתשלום </option>
                                    <option value="late_paid">שולמה באיחור </option>
                                    <option value="PaidBy_Gauartantor">שולמה על ידי ערב</option>
                                </Form.Select>
                            </div>
                        ) : null}
                        {selectedFilter === 'borrowerId' || selectedFilter === 'name' ? (
                            <div className="col">
                                <Form.Label>הזן ערך לסינון:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    placeholder={selectedFilter === 'borrowerId' ? 'לדוגמה: 123456789' : 'לדוגמה: ישראל ישראלי'}
                                />
                            </div>
                        ) : null}

                        {selectedFilter === 'date' ? (
                            <>
                                <div className="col">
                                    <Form.Label>תאריך:</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                    />
                                </div>
                            </>
                        )
                            : null}
                        {selectedFilter === 'amount' ? (
                            <>
                                <div className="col">
                                    <Form.Label>מסכום:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                    />
                                </div>
                                <div className="col">
                                    <Form.Label>עד סכום:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={maxAmount}
                                        onChange={(e) => setMaxAmount(e.target.value)}
                                    />
                                </div>
                            </>
                        )
                            : null}

                        <div className="col-auto">
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setSelectedFilter('');
                                    setFilterValue('');
                                    setFromDate('');
                                }}
                            >
                                נקה סינון
                            </Button>
                        </div>
                    </div>
                </Form>
            </div>

            <Table striped bordered hover >
                <thead>
                    <tr>
                        <th></th>
                        <th>מספר הלוואה</th>
                        <th>סכום</th>
                        <th>סוג החזר</th>
                        <th>יום החזר</th>
                        <th>סך החזר חודשי </th>
                        <th>כמות תשלומים</th>
                        <th>מוחזר ב</th>
                        <th>סטטוס</th>
                        <th>תאריך התחלה</th>
                        <th>הערות</th>
                        <th>תעודת זהות</th>
                        <th>שם הלווה</th>
                        <th>שטר חוב </th>
                        <th> פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLonas?.map((loanMap) => (
                        <React.Fragment key={loanMap.id}>
                            <tr>
                                <td>
                                    <Button
                                        variant="dark"
                                        size="sm"
                                        onClick={() => toggleRow(loanMap.id)}
                                    >
                                        {openRowId === loanMap.id ? "-" : "+"}
                                    </Button>
                                </td>
                                <td>{loanMap.numOfLoan}</td>
                                <td>
                                    {formatAmount(loanMap.amount, loanMap.currency)}
                                </td>
                                <td>{translaterepaymentType(loanMap.repaymentType) || "—"}</td>
                                <td>{loanMap.repaymentDay != "null" ? loanMap.repaymentDay : formatDateToReadable(loanMap.singleRepaymentDate) || "—"}</td>
                                <td>
                                    {loanMap.amountInMonth
                                        ? `${loanMap.amountInMonth} ${loanMap.currency === 'shekel' ? '₪' : '$'}`
                                        : "—"}
                                </td>
                                <td>{loanMap.amountOfPament != "null" ? formatAmount(loanMap.amountOfPament, loanMap.currency) : "—"}</td>
                                <td>{loanMap.typeOfPayment != "null" ? translateMethod(loanMap.typeOfPayment) : "—"}</td>
                                <td>{translateLoanStatus(loanMap.status) || "—"}</td>
                                <td>{formatDateToReadable(loanMap.startDate) || "—"}</td>
                                <td>{loanMap.notes || "—"}</td>
                                <td>{loanMap.borrower?.id || "—"}</td>
                                <td>{loanMap.borrower?.fullName || "—"}</td>

                                <td>
                                    {loanMap.documentPath ? <div>
                                        <Button variant="dark" onClick={() => openModal(loanMap.documentPath)}>
                                            שטר חוב
                                        </Button>
                                    </div> : '-'}
                                </td>
                                <td>
                                    <FaEdit
                                        size={20}
                                        style={{ cursor: 'pointer' }}
                                        title="ערוך"
                                        onClick={() => update(loanMap)}
                                    />
                                    <FaTrash
                                        size={20}
                                        style={{ cursor: 'pointer', color: 'red' }}
                                        title="מחק"
                                        onClick={() => Deleteloan(loanMap.id)}
                                    />
                                </td>
                            </tr>

                            {openRowId === loanMap.id && (
                                <tr>
                                    <td colSpan="10" className="bg-light">
                                        <ul className="mt-3">

                                            <li key={loansMan?.id} className="mb-2">
                                                <strong>הלוואה #{loansMan.id}</strong><br />
                                                <Button onClick={() => handleShowPdf(loansMan)}>
                                                    {pdfVisible ? 'סגור דוח' : 'הצג דוח'}
                                                </Button>
                                                <div id="pdf-container" className="mt-4"></div>
                                                {loansMan.repaymentType === "monthly" ? (
                                                    <>
                                                        💵 סכום התחלתי: {formatAmount(loansMan.amount, loansMan.currency)}<br />
                                                        📆 סכום לחודש: {formatAmount(loansMan.amountInMonth, loansMan.currency) ?? 'לא זמין'}<br />
                                                        📊 כמות תשלומים: {loansMan.amountOfPament ?? 'לא זמין'}<br />
                                                        📅 יום בחודש: {loansMan.repaymentDay ?? 'לא צוין'}<br />
                                                    </>
                                                ) : (
                                                    <>
                                                        💵 סכום: {formatAmount(loansMan.amount, loansMan.currency)}<br />
                                                        📅 תאריך החזר: {formatDateToReadable(loansMan.singleRepaymentDate) || "—"}<br />
                                                    </>
                                                )}
                                                📉 יתרה: {countAmountLeft(loansMan)}<br />
                                                תאריך התחלה: {formatDateToReadable(loansMan.startDate) || "—"}<br />
                                                כמות איחורים: {loansMan.lateCount}<br />
                                                <span style={{
                                                    color: 'white',
                                                    backgroundColor: getStatusColor(loansMan?.status),
                                                    padding: '3px 8px',
                                                    borderRadius: '8px',
                                                    fontWeight: 'bold',
                                                    display: 'inline-block',
                                                    marginTop: '4px'
                                                }}>
                                                    {translateLoanStatus(loansMan?.status)}
                                                </span>

                                                {openLoanId === loansMan?.id && loansMan?.guarantors && loansMan?.guarantors.length > 0 && (
                                                    <ul style={{ marginTop: "0.5em" }}>
                                                        {loansMan?.guarantors.map((g, idx) => (
                                                            <li key={idx}>
                                                                שם ערב: {g.guarantor?.fullName || "לא זמין"}
                                                                {g.documentPath && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => openModal(g.documentPath)}
                                                                    >
                                                                        מסמך ערב
                                                                    </Button>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>

                                                )}
                                                <div className="mt-3">
                                                    <strong style={{ display: "block", marginBottom: "4px" }}>תשלומים:</strong>
                                                    {loansMan?.repayments?.length ? (
                                                        <Table striped bordered size="sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>סכום</th>
                                                                    <th>תאריך</th>
                                                                    <th>אמצעי</th>
                                                                    <th>הערות</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {loansMan?.repayments.map((r, index) => (
                                                                    <tr key={index}>
                                                                        <td>{formatAmount(r.amount, r.currency)}</td>
                                                                        <td>{formatDate(r.paidDate)}</td>
                                                                        <td>{r.typeOfPayment === 'check' ? 'צק' : 'הוראת קבע'}</td>
                                                                        <td>{r.notes || '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    ) : (
                                                        <div>אין תשלומים</div>
                                                    )}
                                                </div>
                                            </li>

                                        </ul>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
            {selectedPdfUrl && (
                <DocumentModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    pdfUrl={selectedPdfUrl}
                />
            )}
            <div className="d-flex justify-content-between">
                <Button onClick={handlePrevPage} disabled={currentPage === 1}>⟵ קודם</Button>
                <span>דף {currentPage} מתוך {totalPages}</span>
                <Button onClick={handleNextPage} disabled={currentPage === totalPages}>הבא ⟶</Button>
            </div>

            <Modal show={showLoanModal} onHide={() => handleclose()} dir="rtl">
                <Modal.Header closeButton className="custom-header">
                    <Modal.Title>הוסף הלוואה חדשה</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form key={formKey} onSubmit={handleSubmit }>
                        <Form.Group className="mb-3">
                            <Form.Label> מספר הלוואה</Form.Label>
                            <Form.Control
                                type="text"
                                name="numOfLoan"
                                value={newLoan.numOfLoan ?? ""}
                                onChange={handleLoanChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>תעודת זהות</Form.Label>
                            <Form.Control
                                type="text"
                                name="borrowerId"
                                value={newLoan.borrowerId ?? ""}
                                onChange={handleLoanChange}
                                required
                                onBlur={() => handleIdBlur(newLoan.borrowerId)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>סכום</Form.Label>
                            <Form.Control
                                type="text"
                                name="amount"
                                value={newLoan.amount ?? ""}
                                onChange={handleAmountChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>תאריך התחלה</Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"
                                value={
                                    newLoan.startDate
                                        ? new Date(newLoan.startDate).toISOString().split('T')[0]
                                        : ''
                                }
                                onChange={handleLoanChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>סוג החזר</Form.Label>
                            <Form.Select
                                name="repaymentType"
                                value={newLoan.repaymentType ?? ""}
                                onChange={handleLoanChange}
                            >
                                <option value="monthly">חודשי</option>
                                <option value="once">חד פעמי</option>
                            </Form.Select>
                        </Form.Group>

                        {newLoan.repaymentType === "monthly" && (
                            <Form.Group className="mb-3">
                                <Form.Label>יום בחודש לתשלום</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="repaymentDay"
                                    value={newLoan.repaymentDay ?? ""}
                                    onChange={handleLoanChange}
                                    min="1"
                                    max="31"
                                />
                            </Form.Group>
                        )}
                        {newLoan.repaymentType === "monthly" && (
                            <Form.Group className="mb-3">
                                <Form.Label>  תשלום חודשי בסך:</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="amountInMonth"
                                    value={newLoan.amountInMonth ?? ""}
                                    onChange={handleLoanChange}
                                />
                            </Form.Group>
                        )}

                        {newLoan.repaymentType === "once" && (
                            <Form.Group className="mb-3">
                                <Form.Label>תאריך החזר</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="singleRepaymentDate"
                                    value={
                                        newLoan.singleRepaymentDate
                                            ? new Date(newLoan.singleRepaymentDate).toISOString().split('T')[0]
                                            : ''
                                    } onChange={handleLoanChange}
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label> שטר חוב</Form.Label>

                            {newLoan.documentPath && typeof newLoan.documentPath === 'string' ? (
                                <div className="mb-2">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <span>קובץ קיים</span>
                                        <div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => openModal(newLoan.documentPath)}
                                            >
                                                הצג קובץ                                                                    </Button>                                            <FaTrash
                                                type="button"
                                                onClick={() =>
                                                    setNewLoan((prev) => ({
                                                        ...prev,
                                                        documentPath: null,
                                                    }))
                                                }
                                            />

                                        </div>
                                    </div>
                                    <DocumentModal
                                        show={showModal}
                                        onClose={() => setShowModal(false)}
                                        pdfUrl={`http://localhost:4000/uploads/${newLoan.documentPath}?token=${token}`}
                                    />
                                    <Form.Label className="mt-2">החלף קובץ:</Form.Label>
                                    <Form.Control
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            setNewLoan((prev) => ({
                                                ...prev,
                                                documentPath: file
                                            }));
                                        }}
                                    />
                                </div>
                            ) : (
                                <Form.Control
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        setNewLoan((prev) => ({
                                            ...prev,
                                            documentPath: file
                                        }));
                                    }}
                                />
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>כמות תשלומים </Form.Label>
                            <Form.Control
                                type="number"
                                name="amountOfPament"
                                value={newLoan.amountOfPament || ''}
                                onChange={handleLoanChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>אמצעי תשלום</Form.Label>
                            <Form.Select
                                name="typeOfPayment"
                                value={newLoan.typeOfPayment || 'check'}
                                onChange={handleLoanChange}
                            >
                                <option value="cash">מזומן</option>
                                <option value="check">צ'ק</option>
                                <option value="Standing_order">הוראת קבע</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>מטבע</Form.Label>
                            <Form.Select
                                name="currency"
                                value={newLoan.currency || 'shekel'}
                                onChange={handleLoanChange}
                            >
                                <option value="shekel">שקל</option>
                                <option value="dollar">דולר</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>הערות</Form.Label>
                            <Form.Control
                                type="text"
                                name="notes"
                                value={newLoan.notes ?? ""}
                                onChange={handleLoanChange}
                            />
                        </Form.Group>

                        {/* ערבים */}
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <Button variant="outline-primary" size="sm" onClick={handleAddGuarantor}>
                                הוסף ערב
                            </Button>
                        </div>

                        {newLoan.guarantors?.map((g, index) => (
                            <div key={index} className="border p-2 mb-2 rounded">
                                <Form.Group className="mb-2">
                                    <Form.Label>ת.ז ערב {index + 1}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={g.PeopleId || ''}
                                        onChange={(e) => {
                                            const updated = [...newLoan.guarantors];
                                            updated[index] = { ...updated[index], PeopleId: e.target.value };
                                            setNewLoan({ ...newLoan, guarantors: updated });
                                        }}
                                        required
                                        onBlur={() => handleIdBlurGuarantor(g.PeopleId, index)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label> שטר חוב ערב</Form.Label>
                                    {g.documentPath ? (
                                        <>
                                            <div className="mb-2">
                                                <div>
                                                    <span>קובץ קיים: </span>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => openModal(g.documentPath)}
                                                    >
                                                        הצג קובץ                                                                    </Button>
                                                    <FaTrash
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = [...newLoan.guarantors];
                                                            updated[index] = {
                                                                ...updated[index],
                                                                document: null,
                                                                documentPath: null
                                                            };
                                                            setNewLoan({ ...newLoan, guarantors: updated });
                                                        }}
                                                    />
                                                </div>
                                                <Form.Label className="mt-2">החלף קובץ:</Form.Label>
                                                <Form.Control
                                                    type="file"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;

                                                        const updated = [...newLoan.guarantors];
                                                        updated[index] = {
                                                            ...updated[index],
                                                            document: file
                                                        };
                                                        setNewLoan({ ...newLoan, guarantors: updated });
                                                    }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <Form.Control
                                            type="file"
                                            onChange={(e) => {
                                                const updated = [...newLoan.guarantors];
                                                updated[index] = {
                                                    ...updated[index],
                                                    document: e.target.files[0]
                                                };
                                                setNewLoan({ ...newLoan, guarantors: updated });
                                            }}
                                        />
                                    )}
                                </Form.Group>

                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => {
                                        const updated = [...newLoan.guarantors];
                                        updated.splice(index, 1);
                                        setNewLoan({ ...newLoan, guarantors: updated });
                                    }}
                                >
                                    הסר ערב
                                </Button>
                            </div>
                        ))}


                        <Button variant="primary" type="submit">
                            שמור
                        </Button>

                        {error && <p className="text-danger mt-2">{error}</p>}
                    </Form>
                </Modal.Body>
            </Modal>

            {/* מודל הוספת איש חדש */}
            <ModelNewPerson showModal={showAddPersonModal} setShowModal={setShowAddPersonModal} />

        </div>
    );
}
