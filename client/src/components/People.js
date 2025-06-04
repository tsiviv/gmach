import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { GetLoansByGuarantor, CreatePerson, DeletePerson, GetLoansByPerson, GetAllPeople, UpdatePerson } from '../servieces/People';
import { FaEdit, FaTrash } from 'react-icons/fa';
import ModelNewPerson from './ModelNewPerson';
import { getDepositByPersonId } from '../servieces/Deposit';
import { useNavigate } from 'react-router-dom';

function People() {
    const [error, setError] = useState("");
    const [people, setPeople] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [openRowId, setOpenRowId] = useState(null);
    const [openLoanId, setOpenLoanId] = useState(null);
    const [render, setrender] = useState(false)
    const [loans, setloans] = useState([])
    const [isEdit, setisEdit] = useState(false)
    const [deposit, setdeposit] = useState('')
    const navigate = useNavigate();
    const [newPerson, setNewPerson] = useState({
        full_name: '',
        phone: '',
        address: '',
        email: '',
        notes: '',
        id: ''
    });
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const filteredpeople = people.filter((person) => {
        if (!selectedFilter) return true;

        if (selectedFilter === 'borrowerId') {
            return person.id.toString().includes(filterValue);
        }

        if (selectedFilter === 'name') {
            return person.fullName.toLowerCase().includes(filterValue.toLowerCase());
        }
        if (selectedFilter === 'email') {
            return person.email.toLowerCase().includes(filterValue.toLowerCase());
        }

        return true;
    });
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await GetAllPeople();
                console.log(res)
                setPeople(res);
            } catch (err) {
                if (err.response?.status === 403 || err.response?.status === 401) {
                    console.log("אין הרשאה");
                    navigate('../')
                } else {
                    console.log(err);
                }
            }
        };
        fetch();
    }, [showModal, render]);
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

    const showLoans = async (id) => {
        try {
            const res = await GetLoansByPerson(id);
            const res2 = await getDepositByPersonId(id);
            setdeposit(res2)
            console.log(res2)
            setloans(res);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            } else {
                console.log(err);
            }
        }
        setOpenRowId(openRowId === id ? null : id)
    }

    const toggleGuarantors = (loanId) => {
        setOpenLoanId(openLoanId === loanId ? null : loanId);
    };
    const handleShow = () => setShowModal(true);
    const update = (PeopleTopUpdate) => {
        setNewPerson({
            full_name: PeopleTopUpdate.fullName,
            phone: PeopleTopUpdate.phone,
            address: PeopleTopUpdate.address,
            email: PeopleTopUpdate.email,
            notes: PeopleTopUpdate.notes,
            id: PeopleTopUpdate.id
        })
        setShowModal(true)
        setisEdit(true)
    }
    const deletePerson = async (id) => {
        try {
            const guarantorLoans = await GetLoansByGuarantor(id);
            const loans = await GetLoansByPerson(id);

            if (loans.length > 0 || guarantorLoans.length > 0) {
                const warningMessage = buildWarningMessage(loans, guarantorLoans);
                alert(warningMessage);
            }
            const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק את האדם הזה?");
            if (!confirmDelete) return;

            const res = await DeletePerson(id);
            setrender(!render)
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

    const buildWarningMessage = (loans, guarantorLoans) => {
        let message = `❗️לא ניתן למחוק את האדם הזה מבלי לבדוק את הנתונים הבאים:\n\n`;

        if (loans.length > 0) {
            message += `📌 האדם הוא **לווה** בהלוואות הבאות:\n`;
            loans.forEach(loan => {
                message += `- הלוואה #${loan.id}: סכום ₪${loan.amount}, מצב: ${loan.status}, תאריך התחלה: ${new Date(loan.startDate).toLocaleDateString()}\n`;
            });
            message += `\n`;
        }

        if (guarantorLoans.length > 0) {
            message += `📌 האדם הוא **ערב** בהלוואות הבאות:\n`;
            guarantorLoans.forEach(guarantor => {
                const loan = guarantor.Loan;
                if (loan) {
                    message += `- הלוואה #${loan.id}: סכום ₪${loan.amount}, מצב: ${loan.status}, לווה: ${loan.borrower?.fullName || 'לא ידוע'}\n`;
                }
            });
            message += `\n`;
        }

        if (loans.length === 0 && guarantorLoans.length === 0) {
            message = "✅ לא נמצאו הלוואות או ערבויות שקשורות לאדם זה. ניתן למחוק.";
        }

        return message;
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-start mb-3">
                <Button variant="primary" onClick={handleShow}>הוסף איש</Button>
                <Form className="mb-3">
                    <div className="row align-items-end">
                        <div className="col">
                            <Form.Label>בחר שדה לסינון:</Form.Label>
                            <Form.Select
                                value={selectedFilter}
                                onChange={(e) => {
                                    setSelectedFilter(e.target.value);
                                    setFilterValue('');
                                    setFromDate('');
                                    setToDate('');
                                }}
                            >
                                <option value="">-- אין סינון --</option>
                                <option value="borrowerId">תעודת זהות</option>
                                <option value="name">שם הלווה</option>
                                <option value="email">אימייל </option>
                            </Form.Select>
                        </div>

                        {selectedFilter === 'borrowerId' || selectedFilter === 'name' || selectedFilter === 'email' ? (
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


                        <div className="col-auto">
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setSelectedFilter('');
                                    setFilterValue('');
                                }}
                            >
                                נקה סינון
                            </Button>
                        </div>
                    </div>
                </Form>

            </div>

            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>תעודת זהות</th>
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
                            <tr key={p.id}>
                                <td>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() =>
                                            showLoans(p.id)
                                        }
                                    >
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
                                    <FaEdit
                                        size={20}
                                        style={{ cursor: 'pointer' }}
                                        title="ערוך"
                                        onClick={() => update(p)}
                                    />
                                    <FaTrash
                                        size={20}
                                        style={{ cursor: 'pointer', color: 'red' }}
                                        title="מחק"
                                        onClick={() => deletePerson(p.id)}
                                    />
                                </td>
                            </tr>

                            {openRowId === p.id && (
                                <tr>
                                    <td colSpan="7" className="bg-light">
                                        {loans.length === 0 ? (
                                            <strong>אין ל {p.fullName} הלוואות</strong>
                                        ) : (
                                            <>
                                                <strong>הלוואות:</strong>
                                                <ul>
                                                    {loans.map((loan) => (
                                                        <li key={loan.id} style={{ marginBottom: "1em" }}>
                                                            סכום: {loan.amount} ש"ח, תשלום חודשי ב-{loan.repaymentDay} לחודש, סטטוס: {translateLoanStatus(loan.status)}{" "}
                                                            <br />
                                                            {loan.lateCount === 0 ? (
                                                                <span>אין איחור בתשלום</span>
                                                            ) : (
                                                                <span>{loan.lateCount} איחורים בתשלום</span>
                                                            )}
                                                            <br />
                                                            <a
                                                                href={`http://localhost:4000/${loan.documentPath}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                שטר חוב                                                            </a>
                                                            <button onClick={() => toggleGuarantors(loan.id)}>
                                                                {openLoanId === loan.id ? "הסתר ערבים" : "הצג ערבים"}
                                                            </button>
                                                            {openLoanId === loan.id && loan.guarantors && loan.guarantors.length > 0 && (
                                                                <ul style={{ marginTop: "0.5em" }}>
                                                                    {loan.guarantors.map((g, idx) => (
                                                                        <li key={idx}>
                                                                            שם ערב: {g.guarantor?.fullName || "לא זמין"}
                                                                            {g.documentPath && (
                                                                                <>
                                                                                    {" - "}
                                                                                    <a href={g.documentPath} target="_blank" rel="noopener noreferrer">
                                                                                        שטר חוב ערב                                                                                    </a>
                                                                                </>
                                                                            )}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                                {deposit && (
                                                    <p>
                                                        {deposit.deposit_amount > 0 && `המשתמש הפקיד ${deposit.deposit_amount} ש"ח`}
                                                        {deposit.deposit_amount > 0 && deposit.pull_amount > 0 && ' ו־'}
                                                        {deposit.pull_amount > 0 && `משך ${deposit.pull_amount} ש"ח`}
                                                    </p>
                                                )}
                                            </>
                                        )}
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
