import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { GetLoansByGuarantor, CreatePerson, DeletePerson, GetLoansByPerson, GetAllPeople, UpdatePerson } from '../servieces/People';
import { FaEdit, FaTrash } from 'react-icons/fa';
import ModelNewPerson from './ModelNewPerson';
function People() {
    const [error, setError] = useState("");
    const [people, setPeople] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [openRowId, setOpenRowId] = useState(null);
    const [openLoanId, setOpenLoanId] = useState(null);
    const [render, setrender] = useState(false)
    const [loans, setloans] = useState([])
    const [isEdit,setisEdit]=useState(false)
    const [newPerson, setNewPerson] = useState({
        full_name: '',
        phone: '',
        address: '',
        email: '',
        notes: '',
        id: ''
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
                } else {
                    console.log(err);
                }
            }
        };
        fetch();
    }, [showModal, render]);
    const showLoans = async (id) => {
        try {
            const res = await GetLoansByPerson(id);
            console.log(res)
            setloans(res);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                console.log("אין הרשאה");
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
                console.log("אין הרשאה");
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
                    {people.map((p, i) => (
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
                                                            סכום: {loan.amount} ש"ח, תשלום חודשי ב-{loan.repaymentDay} לחודש, סטטוס: {loan.status}{" "} <td><a
                                                                href={`http://localhost:4000/${loan.documentPath}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                מסמך הלוואה
                                                            </a></td>
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
                                                                                        מסמך ערבות
                                                                                    </a>
                                                                                </>
                                                                            )}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </td>
                                </tr>

                            )}
                        </>
                    ))}
                </tbody>
            </Table>    
            <ModelNewPerson showModal={showModal} updatePerson={newPerson} setShowModal={setShowModal} isEdit={isEdit} setisEdit={setisEdit}/>     
        </div>
    );
}

export default People;
