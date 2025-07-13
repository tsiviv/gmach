// הקובץ המלא כולל השינויים שביקשת

import { useEffect, useState, useRef } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { GetLoansByGuarantor, CreatePerson, DeletePerson, GetLoansByPerson, GetAllPeople, UpdatePerson } from '../servieces/People';
import { FaEdit, FaTrash } from 'react-icons/fa';
import ModelNewPerson from './ModelNewPerson';
import { getDepositsByPersonId } from '../servieces/Deposit';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatAmount } from './helper'
import { generatePersonReport } from './GenerateReport';
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('he-IL');

function People() {
    const navigate = useNavigate();
    const location = useLocation();
    const [people, setPeople] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [openRowId, setOpenRowId] = useState(null);
    const [render, setrender] = useState(false);
    const [loans, setloans] = useState([]);
    const [isEdit, setisEdit] = useState(false);
    const [deposit, setdeposit] = useState('');
    const [showDetails, setShowDetails] = useState({});
    const rowRefs = useRef({});
    const [newPerson, setNewPerson] = useState({ full_name: '', phone: '', address: '', email: '', notes: '', id: '' });
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [showDeposits, setShowDeposits] = useState({});
    const [showRepayments, setShowRepayments] = useState({});
    const [dep, setdep] = useState()
    const [pdfVisible, setPdfVisible] = useState(false);

    const filteredpeople = people.filter((person) => {
        if (!selectedFilter) return true;
        if (selectedFilter === 'borrowerId') return person.id.toString().includes(filterValue);
        if (selectedFilter === 'name') return person.fullName.toLowerCase().includes(filterValue.toLowerCase());
        if (selectedFilter === 'email') return person.email.toLowerCase().includes(filterValue.toLowerCase());
        return true;
    });

    const getTotalLoanAmount = () => loans.reduce((sum, l) => sum + l.amount, 0);

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

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await GetAllPeople();
                setPeople(res);
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
    }, [showModal, render]);

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

    const showLoans = async (id) => {
        try {
            const res = await GetLoansByPerson(id);
            const res2 = await getDepositsByPersonId(id);
            setdep(res2)
            setdeposit(calculateDepositStats(res2));
            setloans(res);
            console.log("res", res2)
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) navigate('../');
            else console.log(err);
        }
        setOpenRowId(openRowId === id ? null : id);
    };


    const update = (p) => {
        setNewPerson({ full_name: p.fullName, phone: p.phone, address: p.address, email: p.email, notes: p.notes, id: p.id });
        setShowModal(true);
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
    const handleShowPdf = (person, loans, deposits) => {
        const container = document.getElementById('pdf-container');

        if (pdfVisible) {
            container.innerHTML = '';
            setPdfVisible(false);
        } else {
            const url = generatePersonReport(person, loans, deposits);
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
                <Button variant="warning" className="mb-3 ms-5 p-4" onClick={() => setShowModal(true)}>הוסף איש</Button>
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
                                        <strong>סכום כולל הלוואות: ₪{getTotalLoanAmount()}</strong>
                                        <Button onClick={() => handleShowPdf(p, loans, dep)}>
                                            {pdfVisible ? 'סגור דוח' : 'הצג דוח'}
                                        </Button>
                                        <div id="pdf-container" className="mt-4"></div>
                                        <ul className="mt-3">
                                            {loans.map((loan) => (

                                                <li key={loan.id} className="mb-2">
                                                    <strong>הלוואה #{loan.id}</strong><br />
                                                    💵 סכום התחלתי: {formatAmount(loan.amount, loan.currency)}<br />
                                                    📉 יתרה: {formatAmount(countAmountLeft(loan), loan.currency)}<br />
                                                    📆 סכום לחודש: {formatAmount(loan.amountInMonth, loan.currency) ?? 'לא זמין'}<br />
                                                    📅 יום בחודש: {loan.repaymentDay ?? 'לא צוין'}<br />
                                                    📊 כמות תשלומים: {loan.amountOfPament ?? 'לא זמין'}<br />
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
                                                    <div className="mt-2">
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => setShowDeposits(prev => ({ ...prev, [loan.id]: !prev[loan.id] }))}
                                                        >
                                                            {showDeposits[loan.id] ? 'הסתר הפקדות' : 'הצג הפקדות'}
                                                        </Button>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => setShowRepayments(prev => ({ ...prev, [loan.id]: !prev[loan.id] }))}
                                                        >
                                                            {showRepayments[loan.id] ? 'הסתר תשלומים' : 'הצג תשלומים'}
                                                        </Button>
                                                    </div>
                                                    {showDeposits[loan.id] && deposit && (
                                                        <div className="mt-2">
                                                            <p>
                                                                יתרת הפקדות: {formatAmount(deposit.balance, deposit.cureency)}<br></br>
                                                                💰 סך הפקדות: {formatAmount(deposit.totalDeposits.check, deposit.cureency)}<br />
                                                                💸 סך משיכות: {formatAmount(deposit.totalPulls.check, deposit.cureency)}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {showRepayments[loan.id] && loan.repayments && (
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
                                    </td>
                                </tr>
                            )}
                        </>
                    ))}
                </tbody>
            </Table>


            <ModelNewPerson showModal={showModal} updatePerson={newPerson} setShowModal={setShowModal} isEdit={isEdit} setisEdit={setisEdit} />
        </div>
    );
}

export default People;
