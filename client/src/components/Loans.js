import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { CreateLoan, GetAllLoans, GetLoanById, DeleteLoan, UpdateLoan, GetLoanStatusSummary } from "../servieces/Loans";
import { GetPersonById, CreatePerson } from "../servieces/People";
import Table from 'react-bootstrap/Table';
import DocumentModal from "./DocumentModel";
import { FaEdit, FaTrash } from 'react-icons/fa';
import ModelNewPerson from "./ModelNewPerson";
export default function Loans() {
    const [loans, setLoans] = useState([]);
    const [loan, setLoan] = useState([]);
    const [newLoan, setNewLoan] = useState({
        borrowerId: "",
        amount: "",
        startDate: "",
        notes: "",
        repaymentType: "monthly",
        repaymentDay: null,
        singleRepaymentDate: null,
        amountInMonth: null,
        documentPath: null,
        numOfLoan: '',
        guarantors: []
    });
    const [render, setrender] = useState(false)
    const [isEdit, setisEdit] = useState(false);
    const [IdUpdate, setidUpdate] = useState('')
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [error, setError] = useState("");
    const [showLoanModal, setShowLoanModal] = useState(false); // שליטה על מודל ההלוואה
    const [openRowId, setOpenRowId] = useState(null);
    const [showModal, setShowModal] = useState(false);

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
            console.log(res)
            setLoan(res);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                console.log("אין הרשאה");
            } else {
                console.log(err);
            }
        }
        setOpenRowId(openRowId === id ? null : id)
    };
    useEffect(() => {
        async function fetchData() {
            try {
                const allLoans = await GetAllLoans();
                setLoans(allLoans);
                console.log(allLoans)
            } catch (err) {
                console.log(err);
                setError("שגיאה בטעינת נתונים");
            }
        }

        fetchData();
    }, [showLoanModal, render]);

    const handleLoanChange = (e) => {
        const { name, value } = e.target;
        setNewLoan({ ...newLoan, [name]: value });
    };
    const handleIdBlurGuarantor = async (id, index) => {
        console.log("on")
        if (id == newLoan.borrowerId) {
            alert('תעודת זהות של הערב היא תעודת זהות של הלווה')
            const updated = [...newLoan.guarantors];
            updated[index] = { ...updated[index], PeopleId: '' };
            setNewLoan({ ...newLoan, guarantors: updated });
        }
        try {
            const existingPerson = await GetPersonById(id);
            console.log(existingPerson)
            if (!existingPerson) {
                setShowAddPersonModal(true);
                const updated = [...newLoan.guarantors];
                updated[index] = { ...updated[index], PeopleId: '' };
                setNewLoan({ ...newLoan, guarantors: updated });
            }
        }
        catch (e) {
            console.log(e)
        }
    }
    const handleIdBlur = async (id) => {
        console.log("on")
        try {
            const existingPerson = await GetPersonById(id);
            console.log(existingPerson)
            if (!existingPerson) {
                setShowAddPersonModal(true);
                setNewLoan({ ...newLoan, ['borrowerId']: '' });
            }
            else {
                const issues = [];
                const res = await GetLoanStatusSummary(id)
                console.log(res)
                if (res.borrower.pendingOrPartial.length != 0) {
                    alert('למשתמש זה יש כבר הלוואה שעדיין פעילה')
                    setNewLoan({ ...newLoan, ['borrowerId']: '' });
                    return
                }

                if (res.borrower.overdue.length > 0) {
                    issues.push('למשתמש זה יש הלוואה שפג תוקפה ולא שולמה (איחור חריג).');
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
        catch (e) {
            console.log(e)
        }
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("check", newLoan.guarantors, newLoan.documentPath)
        try {
            isEdit ? await UpdateLoan(IdUpdate, newLoan.numOfLoan, newLoan.borrowerId, newLoan.amount, newLoan.startDate, newLoan.notes, newLoan.repaymentType, newLoan.repaymentDay, newLoan.singleRepaymentDate, newLoan.amountInMonth, newLoan.guarantors, newLoan.documentPath) :
                await CreateLoan(newLoan.numOfLoan, newLoan.borrowerId, newLoan.amount, newLoan.startDate, newLoan.notes, newLoan.repaymentType, newLoan.repaymentDay, newLoan.singleRepaymentDate, newLoan.amountInMonth, newLoan.guarantors, newLoan.documentPath)
            setShowLoanModal(false);
            setError('')
        } catch (err) {
            console.log(err);
            setError(err?.response?.data);
        }
    };

    const update = async (LoanToUpdate) => {
        setidUpdate(LoanToUpdate.id)
        let res
        try {
            res = await GetLoanById(LoanToUpdate.id);
            console.log("AD", res.guarantors)
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                console.log("אין הרשאה");
            } else {
                console.log(err);
            }
        } setNewLoan({
            borrowerId: LoanToUpdate.borrowerId,
            amount: LoanToUpdate.amount,
            startDate: LoanToUpdate.startDate,
            notes: LoanToUpdate.notes,
            repaymentType: LoanToUpdate.repaymentType,
            repaymentDay: LoanToUpdate.repaymentDay,
            singleRepaymentDate: LoanToUpdate.singleRepaymentDate,
            amountInMonth: LoanToUpdate.amountInMonth,
            documentPath: LoanToUpdate.documentPath,
            numOfLoan: LoanToUpdate.numOfLoan,
            guarantors: res.guarantors
        })
        setisEdit(true)
        setShowLoanModal(true)
    }
    const Deleteloan = async (id) => {
        try {
            const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק את ההלוואה ?");
            if (!confirmDelete) return;

            // אם עבר אישור – מחיקה
            const res = await DeleteLoan(id);
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
    function formatDateToReadable(dateString) {
        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // חודשים מתחילים מ-0
        const year = date.getFullYear();

        const hours = date.getHours().toString().padStart(2, '0');

        return `${day}/${month}/${year} בשעה ${hours}:00`;
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
        setShowLoanModal(false)
        setisEdit(false)
    }
    const openShowLoanModal = () => {
        setShowLoanModal(true)
        setisEdit(false)
        setNewLoan({
            borrowerId: "",
            amount: "",
            startDate: "",
            notes: "",
            repaymentType: "monthly",
            repaymentDay: null,
            singleRepaymentDate: null,
            amountInMonth: null,
            documentPath: null,
            guarantors: []
        })
    }
    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-start mb-3">
                <Button variant="primary" onClick={() => openShowLoanModal()}>הוסף הלוואה</Button>
            </div>

            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th></th>
                        <th>מספר הלוואה</th>
                        <th>סכום</th>
                        <th>סוג החזר</th>
                        <th>יום החזר</th>
                        <th>סך החזר חודשי </th>
                        <th>סטטוס</th>
                        <th>הערות</th>
                        <th>תעודת זהות</th>
                        <th>שם הלווה</th>
                        <th>טלפון</th>
                        <th>אימייל</th>
                        <th>מסמך הלוואה</th>
                        <th> פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {loans.map((loanMap) => (
                        <React.Fragment key={loanMap.id}>
                            <tr>
                                <td>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => toggleRow(loanMap.id)}
                                    >
                                        {openRowId === loanMap.id ? "-" : "+"}
                                    </Button>
                                </td>
                                <td>{loanMap.numOfLoan}</td>
                                <td>{loanMap.amount || "—"}</td>
                                <td>{translaterepaymentType(loanMap.repaymentType) || "—"}</td>
                                <td>{loanMap.repaymentDay != "null" ? loanMap.repaymentDay : formatDateToReadable(loanMap.singleRepaymentDate) || "—"}</td>
                                <td>{loanMap.amountInMonth != "null" ? loanMap.amountInMonth : "—"}</td>
                                <td>{translateLoanStatus(loanMap.status) || "—"}</td>
                                <td>{loanMap.notes || "—"}</td>
                                <td>{loanMap.borrower?.id || "—"}</td>
                                <td>{loanMap.borrower?.fullName || "—"}</td>
                                <td>{loanMap.borrower?.phone || "—"}</td>
                                <td>{loanMap.borrower?.email || "—"}</td>
                                <td>
                                    {loanMap.documentPath ? <div>
                                        <button onClick={() => setShowModal(true)}>צפייה בקובץ</button>
                                        <DocumentModal show={showModal} onClose={() => setShowModal(false)} pdfUrl={`http://localhost:4000/${loanMap.documentPath}`} />
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
                                        <div style={{ padding: "10px" }}>
                                            <strong>ערבים:</strong>
                                            {loan.guarantors?.length ? (
                                                <ul style={{ marginTop: "0.5em" }}>
                                                    {loan.guarantors.map((g, idx) => (
                                                        <li key={idx}>
                                                            שם ערב: {g.guarantor?.fullName || "לא זמין"}
                                                            {g.documentPath && (
                                                                <>
                                                                    <div>
                                                                        <button onClick={() => setShowModal(true)}>צפייה בקובץ</button>
                                                                        <DocumentModal show={showModal} onClose={() => setShowModal(false)} pdfUrl={`http://localhost:4000/${g.documentPath}`} />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div>אין ערבים</div>
                                            )}

                                            <strong style={{ display: "block", marginTop: "10px" }}>תשלומים:</strong>
                                            {loan.repayments?.length ? (
                                                <ul>
                                                    {loan.repayments.map((r, index) => (
                                                        <li key={index}>
                                                            {formatDateToReadable(r.paidDate)}: ₪{r.amount}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div>אין תשלומים</div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>


            {/* מודל הלוואה חדשה */}
            <Modal show={showLoanModal} onHide={() => handleclose()} dir="rtl">
                <Modal.Header closeButton>
                    <Modal.Title>הוסף הלוואה חדשה</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label> מספר הזמנה</Form.Label>
                            <Form.Control
                                type="text"
                                name="numOfLoan"
                                value={newLoan.numOfLoan}
                                onChange={handleLoanChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>תעודת זהות</Form.Label>
                            <Form.Control
                                type="text"
                                name="borrowerId"
                                value={newLoan.borrowerId}
                                onChange={handleLoanChange}
                                required
                                onBlur={() => handleIdBlur(newLoan.borrowerId)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>סכום</Form.Label>
                            <Form.Control
                                type="number"
                                name="amount"
                                value={newLoan.amount}
                                onChange={handleLoanChange}
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
                                value={newLoan.repaymentType}
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
                                    value={newLoan.repaymentDay}
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
                                    value={newLoan.amountInMonth}
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
                                    value={newLoan.singleRepaymentDate}
                                    onChange={handleLoanChange}
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>מסמך הלווה</Form.Label>

                            {newLoan.documentPath && typeof newLoan.documentPath === 'string' ? (
                                <div className="mb-2">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <span>קובץ קיים</span>
                                        <div>
                                            <button onClick={() => setShowModal(true)} className="btn btn-link btn-sm">הצג קובץ</button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm ms-2"
                                                onClick={() =>
                                                    setNewLoan((prev) => ({
                                                        ...prev,
                                                        documentPath: null,
                                                    }))
                                                }
                                            >
                                                <i className="bi bi-trash"></i> {/* Bootstrap icon */}
                                            </button>
                                        </div>
                                    </div>
                                    <DocumentModal
                                        show={showModal}
                                        onClose={() => setShowModal(false)}
                                        pdfUrl={`http://localhost:4000/${newLoan.documentPath}`}
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
                            <Form.Label>הערות</Form.Label>
                            <Form.Control
                                type="text"
                                name="notes"
                                value={newLoan.notes}
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
                                    <Form.Label>מסמך ערב</Form.Label>
                                    {g.documentPath ? (
                                        <>
                                            <div className="mb-2">
                                                <div>
                                                    <span>קובץ קיים: </span>
                                                    <div>
                                                        <button onClick={() => setShowModal(true)}>הצג קובץ</button>
                                                        <DocumentModal show={showModal} onClose={() => setShowModal(false)} pdfUrl={`http://localhost:4000/${g.documentPath}`} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm ms-2"
                                                        onClick={() => {
                                                            const updated = [...newLoan.guarantors];
                                                            updated[index] = {
                                                                ...updated[index],
                                                                document: null,
                                                                documentPath: null
                                                            };
                                                            setNewLoan({ ...newLoan, guarantors: updated });
                                                        }}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
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
