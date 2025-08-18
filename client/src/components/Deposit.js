import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import { formatAmount, format } from './helper'
import {
    createDeposit, getDepositsByPersonId,
    getAllDeposits, deleteDeposit, updateDeposit, getCurrentBalance
} from '../servieces/Deposit';
import ModelNewPerson from './ModelNewPerson';
import { GetPersonById } from '../servieces/People';
import { useNavigate } from 'react-router-dom';
import { generateDepositReport, generatePersonReport } from './GenerateReport';
export default function Deposite() {
    const [Deposites, setDeposites] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentDeposite, setcurrentDeposite] = useState({
        id: null,
        PeopleId: '',
        amount: '',
        repaymentType: 'once',
        description: '',
        date: '',
        method: 'deposit',
        typeOfPayment: 'check',
        currency: 'shekel',
    });
    const navigate = useNavigate();
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [error, setError] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchId, setSearchId] = useState('');
    const [searchMethod, setSearchMethod] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(50);

    useEffect(() => {
        loadDeposites(currentPage);
    }, [currentPage]);

    const loadDeposites = async (page) => {
        try {
            const res = await getAllDeposits(page, pageSize); // קריאה עם דף ומספר רשומות
            setDeposites(res.data);
            setTotalPages(res.totalPages); // להחזיר מהשרת
        } catch (err) {
            console.error('שגיאה בטעינת הפקדות:', err);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setcurrentDeposite((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleIdBlur = async () => {
        try {
            const existingPerson = await GetPersonById(currentDeposite.PeopleId);
            if (!existingPerson) {
                setShowAddPersonModal(true);
                setcurrentDeposite({ ...currentDeposite, ['PeopleId']: '' });
            }
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../');
            }
        }
    };

    const handleAdd = () => {
        setcurrentDeposite({
            id: null,
            PeopleId: '',
            amount: '',
            repaymentType: 'once',
            description: '',
            date: '',
            method: 'deposit',
            typeOfPayment: 'check',
            currency: 'shekel',
        });
        setIsEdit(false);
        setShowModal(true);
    };

    const handleEdit = (turn) => {
        setcurrentDeposite({
            id: turn.id,
            PeopleId: turn.PeopleId,
            amount: format(turn.amount),
            repaymentType: turn.repaymentType,
            description: turn.description,
            date: turn.date ? turn.date.split('T')[0] : '',
            isDeposit: turn.isDeposit !== undefined ? turn.isDeposit : true,
            method: turn.method || 'check',
            typeOfPayment: turn.typeOfPayment || 'check',
            currency: turn.currency || 'shekel',
        });
        setIsEdit(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('אתה בטוח שברצונך למחוק את התנועה הזו?')) {
            try {
                await deleteDeposit(id);
                loadDeposites();
            } catch (err) {
                console.log(err)
                if (err.response) {
                    if (err.response.status === 400) {
                        alert(`שגיאה: ${err.response.data.error || 'בקשה לא חוקית'}`);
                    } else {
                        alert(`שגיאה בשרת (${err.response.status})`);
                    }
                } else {
                    alert(`שגיאת רשת: ${err.message}`);
                }
            }
        }
    };

    const handleClose = () => {
        setShowModal(false);
        loadDeposites();
    };

    const handleSubmit = async (e) => {
        e.preventDefault(currentDeposite);
        if (!currentDeposite.PeopleId) {
            setError('יש להזין תעודת זהות');
            return;
        }
        if (!currentDeposite.amount) {
            setError('יש להזין סכום');
            return;
        }
        let balancePresonShekel = 0;
        let balancePresonDollar = 0;
        try {
            const res = await getCurrentBalance(currentDeposite.PeopleId);
            balancePresonShekel = res.balanceShekel;
            balancePresonDollar = res.balanceDollar
        } catch (e) {
            console.log(e);
        }
        try {
            if (isEdit) {
                currentDeposite.amount = currentDeposite.amount.replace(/,/g, '')
                await updateDeposit(currentDeposite.id, currentDeposite);
            } else {
                await createDeposit({
                    PeopleId: currentDeposite.PeopleId,
                    amount: currentDeposite.amount.replace(/,/g, ''),
                    date: currentDeposite.date,
                    typeOfPayment: currentDeposite.typeOfPayment,
                    description: currentDeposite.description,
                    currency: currentDeposite.currency,
                    method: currentDeposite.method,
                    isDeposit: currentDeposite.method === "deposit"
                });
            }
            let alldepsoit = []
            let person
            if (currentDeposite.method === "deposit") {
                try {
                    alldepsoit = await getDepositsByPersonId(currentDeposite.PeopleId);
                    person = await GetPersonById(currentDeposite.PeopleId);
                    const res = await getCurrentBalance(currentDeposite.PeopleId);
                    console.log(res)
                    balancePresonShekel = res.balanceShekel;
                    balancePresonDollar = res.balanceDollar
                    currentDeposite.amount = Number(currentDeposite.amount.replace(/,/g, '').trim());
                } catch (e) {
                    console.log(e);
                }
                handleShowPdf(currentDeposite, person, balancePresonShekel, balancePresonDollar, alldepsoit)
            }
            setError("")
            handleClose();
        } catch (err) {
            setError(err?.response?.data?.error || 'שגיאה בלתי צפויה');
        }
    };

    const translateMethod = (method) => {
        switch (method) {
            case 'check': return "צ'ק";
            case 'Standing_order': return 'הוראת קבע';
            case 'cash': return 'מזומן';
            default: return method;
        }
    };
    const handleShowPdf = async (deposite, person,balancePresonShekel, balancePresonDollar, history) => {
        const url = await generateDepositReport(deposite, person, balancePresonShekel, balancePresonDollar, history);

        const container = document.getElementById('pdf-container-2');
        container.innerHTML = ''; // ריקון לפני יצירה

        // יצירת iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = '100%';
        iframe.height = '600px';
        iframe.style.border = 'none';

        // יצירת כפתור סגירה
        const closeBtn = document.createElement('button');
        closeBtn.innerText = '✖ סגור';
        closeBtn.style.margin = '10px 0';
        closeBtn.style.padding = '5px 10px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.backgroundColor = '#f44336';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '4px';
        closeBtn.onclick = () => {
            container.innerHTML = ''; // הסרה
        };

        container.appendChild(closeBtn);
        container.appendChild(iframe);
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, ''); // הסרת פסיקים
        if (!/^\d*$/.test(rawValue)) return; // חסום תווים לא מספריים

        const numericValue = Number(rawValue);
        const formattedValue = format(numericValue);
        setcurrentDeposite((prev) => ({
            ...prev,
            amount: formattedValue,
        }));
    };

    const filteredDeposits = Deposites.filter(dep => {
        const nameMatch = dep.person.fullName.includes(searchName);
        const idMatch = dep.PeopleId.toString().includes(searchId);
        const methodMatch = searchMethod ? (searchMethod === 'deposit' ? dep.isDeposit : !dep.isDeposit) : true;
        return nameMatch && idMatch && methodMatch;
    });

    return (
        <div className="container pt-5" dir="rtl">
            <div className="header-turns mb-3 d-flex justify-content-between align-items-center">
                <Button variant="warning" onClick={handleAdd}>הוסף תנועה</Button>
            </div>
            <Form className="mb-3">
                <div className="row align-items-end">
                    <div className="col">
                        <Form.Label>בחר שדה לסינון:</Form.Label>
                        <Form.Select
                            value={searchMethod}
                            onChange={(e) => setSearchMethod(e.target.value)}
                        >
                            <option value="">-- כל הסוגים --</option>
                            <option value="deposit">הפקדה</option>
                            <option value="pull">משיכה</option>
                        </Form.Select>
                    </div>

                    <div className="col">
                        <Form.Label>חיפוש לפי שם:</Form.Label>
                        <Form.Control
                            type="text"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            placeholder="לדוגמה: ישראל ישראלי"
                        />
                    </div>

                    <div className="col">
                        <Form.Label>חיפוש לפי ת.ז:</Form.Label>
                        <Form.Control
                            type="text"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            placeholder="לדוגמה: 123456789"
                        />
                    </div>

                    <div className="col-auto">
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setSearchName('');
                                setSearchId('');
                                setSearchMethod('');
                            }}
                        >
                            נקה סינון
                        </Button>
                    </div>
                </div>
            </Form>
            <div id="pdf-container-2" className="mt-4"></div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ת"ז</th><th>שם</th><th>סכום</th><th>שיטת תשלום</th><th>סוג פעולה</th><th>יתרת הפקדה בדולרים</th><th> יתרת הפקדה בשקלים</th><th>תיאור</th><th>תאריך</th><th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredDeposits.map((Deposite) => (
                        <tr key={Deposite.id}>
                            <td>{Deposite.PeopleId}</td>
                            <td>{Deposite.person.fullName}</td>
                            <td>{formatAmount(Deposite.amount, Deposite.currency)}</td>
                            <td>{translateMethod(Deposite.typeOfPayment)}</td>
                            <td>{Deposite.isDeposit ? 'הפקדה' : 'משיכה'}</td>
                            <td>{formatAmount(Deposite.balanceDollar, "dollar")}</td>
                            <td>{formatAmount(Deposite.balanceShekel, "shekel")}</td>
                            <td>{Deposite.description}</td>
                            <td>{Deposite.date ? Deposite.date.split('T')[0] : ''}</td>
                            <td>
                                <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(Deposite)}>ערוך</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(Deposite.id)}>מחק</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <div className="d-flex justify-content-between">
                <Button onClick={handlePrevPage} disabled={currentPage === 1}>⟵ קודם</Button>
                <span>דף {currentPage} מתוך {totalPages}</span>
                <Button onClick={handleNextPage} disabled={currentPage === totalPages}>הבא ⟶</Button>
            </div>
            <Modal show={showModal} onHide={handleClose} dir="rtl">
                <Modal.Header closeButton className="custom-header">
                    <Modal.Title>
                        {isEdit ? 'עריכת תנועה' : 'הוספת תנועה'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit} className="text-end" dir="rtl">
                        <Form.Group className="mb-2 text-end">
                            <Form.Label className="float-end">תעודת זהות</Form.Label>
                            <Form.Control
                                type="text"
                                name="PeopleId"
                                value={currentDeposite.PeopleId}
                                onChange={handleChange}
                                onBlur={handleIdBlur}
                                required
                                style={{ textAlign: 'right' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2 text-end">
                            <Form.Label className="float-end">סכום</Form.Label>
                            <Form.Control
                                type="text"
                                name="amount"
                                value={currentDeposite.amount}
                                onChange={handleAmountChange}
                                required
                                style={{ textAlign: 'right' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2 text-end">
                            <Form.Label className="float-end">שיטת תשלום</Form.Label>
                            <Form.Select
                                name="typeOfPayment"
                                value={currentDeposite.typeOfPayment}
                                onChange={handleChange}
                                required
                                style={{ textAlign: 'right' }}
                            >
                                <option value="chash">מזומן</option>
                                <option value="check">צ'ק</option>
                                <option value="Standing_order">הוראת קבע</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2 text-end">
                            <Form.Label className="float-end">סוג פעולה</Form.Label>
                            <Form.Select
                                name="isDeposit"
                                value={currentDeposite.method}
                                onChange={(e) =>
                                    setcurrentDeposite((prev) => ({
                                        ...prev,
                                        method: e.target.value,
                                    }))
                                }
                                style={{ textAlign: 'right' }}
                            >
                                <option value="deposit">הפקדה</option>
                                <option value="deposit_pull">משיכה</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2 text-end">
                            <Form.Label className="float-end">תיאור</Form.Label>
                            <Form.Control
                                type="text"
                                name="description"
                                value={currentDeposite.description}
                                onChange={handleChange}
                                style={{ textAlign: 'right' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2 text-end">
                            <Form.Label className="float-end">תאריך</Form.Label>
                            <Form.Control
                                type="date"
                                name="date"
                                value={currentDeposite.date}
                                onChange={handleChange}
                                required
                                style={{ textAlign: 'right' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2 text-end">
                            <Form.Label className="float-end">מטבע</Form.Label>
                            <Form.Select
                                name="currency"
                                value={currentDeposite.currency}
                                onChange={handleChange}
                                required
                                style={{ textAlign: 'right' }}
                            >
                                <option value="shekel">שקל</option>
                                <option value="dollar">דולר</option>
                            </Form.Select>
                        </Form.Group>

                        {error && <p className="error text-danger text-end">{error}</p>}

                        <div className="text-end mt-3">
                            <Button type="submit">{isEdit ? 'עדכן' : 'הוסף'}</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>


            <ModelNewPerson showModal={showAddPersonModal} setShowModal={setShowAddPersonModal} />
        </div>
    );
}
