// הקובץ המלא כולל השינויים שביקשת

import { useEffect, useState, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { GetLoansByGuarantor, CreatePerson, DeletePerson, GetLoansByPerson, GetAllPeople, UpdatePerson } from '../servieces/People';
import { FaEdit, FaTrash } from 'react-icons/fa';
import ModelNewPerson from './ModelNewPerson';
import { getCurrentBalance, getDepositsByPersonId } from '../servieces/Deposit';
import { getCurrentBalance, getDepositsByPersonId } from '../servieces/Deposit';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatAmount } from './helper'
import { generatePersonReport } from './GenerateReport';
import DocumentModal from "./DocumentModel";

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('he-IL');

function People() {
    const navigate = useNavigate();
    const location = useLocation();
    const [people, setPeople] = useState([]);
    const [showPersonModal, setShowPersonModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [openLoanId, setOpenLoanId] = useState(false);
    const [openRowId, setOpenRowId] = useState(null);
    const [render, setrender] = useState(false);
    const [loans, setloans] = useState([]);
    const [isEdit, setisEdit] = useState(false);
    const [deposit, setdeposit] = useState('');
    const rowRefs = useRef({});
    const [newPerson, setNewPerson] = useState({ full_name: '', phone: '', address: '', email: '', notes: '', id: '' });
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [showDeposits, setShowDeposits] = useState({});
    const [showRepayments, setShowRepayments] = useState({});
    const [dep, setdep] = useState()
    const [pdfVisible, setPdfVisible] = useState(false);
    const token = sessionStorage.getItem('token');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(50); // מספר רשומות לדף
     const [showModal, setShowModal] = useState(false);
    const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
    const filteredpeople = people.filter((person) => {
        if (!selectedFilter) return true;
        if (selectedFilter === 'borrowerId') return person.id.toString().includes(filterValue);
        if (selectedFilter === 'name') return person.fullName.toLowerCase().includes(filterValue.toLowerCase());
        if (selectedFilter === 'email') return person.email.toLowerCase().includes(filterValue.toLowerCase());
        return true;
    });


    const translateLoanStatus = (status) => {
        const statusMap = {
            pending: 'פעילה',
            partial: 'שולמה חלקית',
            paid: 'שולמה',
            overdue: 'פיגור בתשלום',
            late_paid: 'שולמה באיחור',
            PaidBy_Gauartantor: 'שולמה על ידי ערב',
        };
        return statusMap[status] || 'לא ידוע';
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await GetAllPeople(currentPage, pageSize);
                setPeople(res.data);
                setTotalPages(res.totalPages);
                console.log(res)
                if (location.state?.openPersonId) {
                    const personIdToOpen = location.state.openPersonId;
                    setTimeout(() => {
                        showLoans(personIdToOpen);
                        setTimeout(() => {
                            if (rowRefs.current[personIdToOpen]) {
                                rowRefs.current[personIdToOpen].scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 500);
                    }, 300);
                }
            } catch (err) {
                if (err.response?.status === 403 || err.response?.status === 401) {
                    navigate('../');
                } else {
                    console.log(err);
                }
            }
        };
        fetch();
    }, [showPersonModal, render, currentPage]);

const openModal = (path) => {
        setSelectedPdfUrl(`http://localhost:4000/uploads/${path}?token=${token}`);
        setShowModal(true);
    };

    const countAmountLeft = (loan) => {
        let total = loan.amount
        loan.repayments.forEach(element => {
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

        function formatDateToReadable(dateString) {
        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year} `;
    }  
      function formatDateToReadable(dateString) {
        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year} `;
    }
    const showLoans = async (id) => {
        try {
            const res = await GetLoansByPerson(id);
            const res2 = await getCurrentBalance(id);
            setdep(res2)
            setdeposit(res2);
            setdeposit(res2);
            setloans(res);
            setOpenLoanId(openLoanId === res[0].id ? null : res[0].id)
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) navigate('../');
            else console.log(err);
        }
        setOpenRowId(openRowId === id ? null : id);
    };


    const update = (p) => {
        setNewPerson({ full_name: p.fullName, phone: p.phone, address: p.address, email: p.email, notes: p.notes, id: p.id });
        setShowPersonModal(true);
        setisEdit(true);
    };

    const deletePerson = async (id) => {
        try {
            const guarantorLoans = await GetLoansByGuarantor(id);
            const loans = await GetLoansByPerson(id);
            if (loans.length > 0 || guarantorLoans.length > 0) {
                alert("אדם זה מקושר להלוואות או ערבויות ולא ניתן למחוק אותו");
                return;
            }
            const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק את האדם הזה?");
            if (!confirmDelete) return;
            await DeletePerson(id);
            setrender(!render);
        } catch (err) {
            console.log(err);
            if (err.response?.status === 403 || err.response?.status === 401) navigate('../');
        }
    };
    function calculateDepositStats(transactions) {
        const stats = {
            totalDeposits: {},
            totalPulls: {},
            balance: 0,
        };

        transactions.forEach(tx => {
            const { isDeposit, typeOfPayment, amount, balanceAfter } = tx;
            const type = typeOfPayment || 'unknown';

            if (isDeposit) {
                stats.totalDeposits[type] = (stats.totalDeposits[type] || 0) + Number(amount);
            } else {
                stats.totalPulls[type] = (stats.totalPulls[type] || 0) + Number(amount);
            }

        });
        stats.balance = stats.totalDeposits.check - stats.totalPulls.check
        console.log(stats)
        return stats;
    }
    const handleShowPdf = async (person, loans, deposits) => {
        const container = document.getElementById('pdf-container');

        if (pdfVisible) {
            container.innerHTML = '';
            setPdfVisible(false);
        } else {
            const url = await generatePersonReport(person, loans, deposits);
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
    return (
        <div className="container pt-5">
            <div className="d-flex justify-content-start mb-3">
                <Button variant="warning" className="mb-3 ms-5 p-4" onClick={() => setShowPersonModal(true)}>הוסף איש</Button>
                <Form className="mb-3">
                    <div className="row align-items-end">
                        <div className="col">
                            <Form.Label>בחר שדה לסינון:</Form.Label>
                            <Form.Select value={selectedFilter} onChange={(e) => { setSelectedFilter(e.target.value); setFilterValue(''); }}>
                                <option value="">-- אין סינון --</option>
                                <option value="borrowerId">תעודת זהות</option>
                                <option value="name">שם הלווה</option>
                                <option value="email">אימייל</option>
                            </Form.Select>
                        </div>
                        {selectedFilter && (
                            <div className="col">
                                <Form.Label>הזן ערך לסינון:</Form.Label>
                                <Form.Control type="text" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />
                            </div>
                        )}
                        <div className="col-auto">
                            <Button variant="outline-secondary" onClick={() => { setSelectedFilter(''); setFilterValue(''); }}>נקה סינון</Button>
                        </div>
                    </div>
                </Form>
            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>ת.ז</th>
                        <th>שם מלא</th>
                        <th>טלפון</th>
                        <th>כתובת</th>
                        <th>אימייל</th>
                        <th>הערות</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredpeople.map((p, i) => (
                        <>
                            <tr key={p.id} ref={el => rowRefs.current[p.id] = el} style={{ backgroundColor: openRowId === p.id ? "#f5f5dc" : undefined }}>
                                <td>
                                    <Button variant="dark" size="sm" onClick={() => showLoans(p.id)}>
                                        {openRowId === p.id ? "-" : "+"}
                                    </Button>
                                </td>
                                <td>{p.id}</td>
                                <td>{p.fullName}</td>
                                <td>{p.phone}</td>
                                <td>{p.address}</td>
                                <td>{p.email}</td>
                                <td>{p.notes}</td>
                                <td>
                                    <FaEdit size={20} style={{ cursor: 'pointer' }} onClick={() => update(p)} />
                                    <FaTrash size={20} style={{ cursor: 'pointer', color: 'red' }} onClick={() => deletePerson(p.id)} />
                                </td>
                            </tr>

                            {openRowId === p.id && (
                                <tr>
                                    <td colSpan="8" className="bg-light">
                                        {/* <strong>סכום כולל הלוואות: ₪{getTotalLoanAmount()}</strong> */}
                                        <Button onClick={() => handleShowPdf(p, loans, dep)}>
                                            {pdfVisible ? 'סגור דוח' : 'הצג דוח'}
                                        </Button>
                                        <div id="pdf-container" className="mt-4"></div>
                                        <ul className="mt-3">
                                            {loans.map((loan) => (

                                                <li key={loan.id} className="mb-2">

                                                    <strong>הלוואה #{loan.id}</strong><br />

                                                  {loan.repaymentType === "monthly" ? (
                                                                                                      <>
                                                                                                          💵 סכום התחלתי: {formatAmount(loan.amount, loan.currency)}<br />
                                                                                                          📆 סכום לחודש: {formatAmount(loan.amountInMonth, loan.currency) ?? 'לא זמין'}<br />
                                                                                                          📊 כמות תשלומים: {loan.amountOfPament ?? 'לא זמין'}<br />
                                                                                                          📅 יום בחודש: {loan.repaymentDay ?? 'לא צוין'}<br />
                                                                                                      </>
                                                                                                  ) : (
                                                                                                      <>
                                                                                                          💵 סכום: {formatAmount(loan.amount, loan.currency)}<br />
                                                                                                          📅 תאריך החזר: {formatDateToReadable(loan.singleRepaymentDate) || "—"}<br />
                                                                                                      </>
                                                                                                  )}
                                                                                                  📉 יתרה: {countAmountLeft(loan)}<br />
                                                                                                  תאריך התחלה: {formatDateToReadable(loan.startDate) || "—"}<br />
                                                                                                  כמות איחורים: {loan.lateCount}<br />
                                                    {loan.documentPath ? <div>
                                        <Button variant="dark" onClick={() => openModal(loan.documentPath)}>
                                            שטר חוב
                                        </Button>
                                    </div> : '-'}
                                                    <span style={{
                                                        color: 'white',
                                                        backgroundColor: getStatusColor(loan.status),
                                                        padding: '3px 8px',
                                                        borderRadius: '8px',
                                                        fontWeight: 'bold',
                                                        display: 'inline-block',
                                                        marginTop: '4px'
                                                    }}>
                                                        {translateLoanStatus(loan.status)}
                                                    </span>
                                                    <br></br>


                                                    {openLoanId === loan.id && loan.guarantors && loan.guarantors.length > 0 && (
                                                        <ul style={{ marginTop: "0.5em" }}>
                                                            {loan.guarantors.map((g, idx) => (
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
                                                    <div className="mt-2">
                                                        {deposit.length > 0 && (
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                className="me-2"
                                                                onClick={() => setShowDeposits(prev => ({ ...prev, [loan.id]: !prev[loan.id] }))}
                                                            >
                                                                {showDeposits[loan.id] ? 'הסתר הפקדות' : 'הצג הפקדות'}
                                                            </Button>
                                                        )}

                                                        {loan.repayments.length > 0 && (
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => setShowRepayments(prev => ({ ...prev, [loan.id]: !prev[loan.id] }))}
                                                            >
                                                                {showRepayments[loan.id] ? 'הסתר תשלומים' : 'הצג תשלומים'}
                                                            </Button>
                                                        )}

                                                    </div>


                                                    {showRepayments[loan.id] && loan.repayments.length && (
                                                        <div className="mt-2">
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
                                                                    {loan.repayments.map((r, index) => (
                                                                        <tr key={index}>
                                                                            <td>{formatAmount(r.amount, r.currency)}</td>
                                                                            <td>{formatDate(r.paidDate)}</td>
                                                                            <td>{r.typeOfPayment === 'check' ? 'צק' : 'הוראת קבע'}</td>
                                                                            <td>{r.notes || '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </li>
                                            ))}


                                        </ul>
                                        {deposit && (
                                            <div className="mt-3">
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowDeposits(prev => ({ ...prev, [p.id]: !prev[p.id] }))
                                                    }
                                                >
                                                    {showDeposits[p.id] ? 'הסתר הפקדות' : 'הצג הפקדות'}
                                                </Button>

                                                {showDeposits[p.id] && (
                                                    <Table striped bordered size="sm" className="mt-2">
                                                        <thead>
                                                            <tr>
                                                                <th>סוג הפקדה</th>
                                                                <th>סכום</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>יתרת הפקדות בשקלים</td>
                                                                <td>{formatAmount(deposit.balanceShekel, "shekel")}</td>
                                                            </tr>
                                                            <tr>
                                                                <td>יתרת הפקדות בדולרים</td>
                                                                <td>{formatAmount(deposit.balanceDollar, "dollar")}</td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                )}
                                            </div>
                                        )}

                                        {deposit && (
                                            <div className="mt-3">
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowDeposits(prev => ({ ...prev, [p.id]: !prev[p.id] }))
                                                    }
                                                >
                                                    {showDeposits[p.id] ? 'הסתר הפקדות' : 'הצג הפקדות'}
                                                </Button>

                                                {showDeposits[p.id] && (
                                                    <Table striped bordered size="sm" className="mt-2">
                                                        <thead>
                                                            <tr>
                                                                <th>סוג הפקדה</th>
                                                                <th>סכום</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>יתרת הפקדות בשקלים</td>
                                                                <td>{formatAmount(deposit.balanceShekel, "shekel")}</td>
                                                            </tr>
                                                            <tr>
                                                                <td>יתרת הפקדות בדולרים</td>
                                                                <td>{formatAmount(deposit.balanceDollar, "dollar")}</td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                )}
                                            </div>
                                        )}

                                    </td>
                                </tr>
                            )}
                        </>
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

            <ModelNewPerson showModal={showPersonModal} updatePerson={newPerson} setShowModal={setShowPersonModal} isEdit={isEdit} setisEdit={setisEdit} />
        </div>
    );
}

export default People;
