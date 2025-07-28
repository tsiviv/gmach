import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Form } from 'react-bootstrap';
import {
    getAllMovements,
    createFundMovement,
    updateFundMovement
} from '../servieces/FundMovement'
import { FaEdit, FaTrash } from 'react-icons/fa';
import {
    CreatePerson,
    GetPersonById
} from '../servieces/People';
import '../styles/fund.css'
import ModelNewPerson from './ModelNewPerson';
import { useNavigate } from 'react-router-dom';
import { formatAmount, format } from './helper'
import { generateDonationReport, generateMovmentReport } from './GenerateReport';

export default function FundMovementsPage({ isAdmin }) {
    const [movements, setMovements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [id, setid] = useState('')
    const navigate = useNavigate();
    const [MoneyInGmach, setMoneyInGmach] = useState(0)
    const [currentMovement, setCurrentMovement] = useState({
        amount: '',
        type: 'manual_adjustment',
        description: '',
        date: '',
        personId: '',
        typeOfPayment: 'check',
        currency: 'shekel',
    });
    const [toDate, setToDate] = useState('');
    const [pdfVisible, setPdfVisible] = useState(false);
    const [showMoney, setShowMoney] = useState(false);
    const [showPersonModal, setShowPersonModal] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const filteredmovements = movements.filter((movement) => {
        if (!selectedFilter) return true;
        if (selectedFilter === 'borrowerId') {
            return movement.person?.id.toString().includes(filterValue);
        }

        if (selectedFilter === 'name') {
            return movement.person?.fullName.toLowerCase().includes(filterValue.toLowerCase());
        }

        if (selectedFilter === 'dateRange') {
            if (!fromDate || !toDate) return true;
            return movement.date >= fromDate && movement.date <= toDate;
        }

        if (selectedFilter === 'date') {
            if (!fromDate) return true;
            return movement.date === fromDate;
        }

        if (selectedFilter === 'amount') {
            const amount = Number(movement.amount);
            const min = Number(minAmount) || 0;
            const max = Number(maxAmount) || Infinity;
            return amount >= min && amount <= max;
        }

        return true;
    });
    const handleShowPdf = async (personMovements) => {
        const container = document.getElementById('pdf-container');

        if (pdfVisible) {
            container.innerHTML = '';
            setPdfVisible(false);
        } else {
            const url = await generateMovmentReport(personMovements);
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

    useEffect(() => {
        loadMovements();
    }, []);
    // פונקציה לסיכום יתרת תנועות לפי מטבע עבור אדם מסוים
    const countPersonBalance = (personId) => {
        const personMovements = movements.filter(m => m.personId === personId);
        const balances = {};

        personMovements.forEach(element => {
            console.log(element)
            const type = (element.type || '').toLowerCase().trim();
            const amount = element.amount
            const currency = element.currency
            if (currency !== "dollar" && currency !== "shekel")
                return
            if (!balances[currency]) {
                balances[currency] = 0;
            }
            if (['donation', 'deposit', 'repayment_received'].includes(type)) {
                balances[currency] += amount;
            } else {
                balances[currency] -= amount;
            }
        });
        console.log(balances, "balances")
        return balances;
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (!/^\d*$/.test(rawValue)) return;

        const numericValue = Number(rawValue);
        const formattedValue = format(numericValue);
        setCurrentMovement((prev) => ({
            ...prev,
            amount: formattedValue,
        }));
    };

    const countMoneyInKopa = (data) => {
        const balances = {};

        data.forEach(element => {
            const type = (element.type || '').toLowerCase().trim();
            const amount = Number(element.amount) || 0;
            const currency = element.currency;
            console.log(element.currency, "DSFR")
            if (currency !== 'shekel' && currency !== 'dollar') {
                console.log(currency, "SWDF")
                return;
            }

            if (!balances[currency]) {
                balances[currency] = 0;
            }

            if (['manual_adjustment', 'donation', 'deposit', 'repayment_received'].includes(type)) {
                balances[currency] += amount;
            } else {
                balances[currency] -= amount;
            }
        });

        console.log(balances);
        setMoneyInGmach(balances);
    };


    function translateMovmemntType(MovmemntType) {
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
    function translatePaymentType(MovmemntType) {
        const statusMap = {
            check: 'צ"ק',
            Standing_order: 'הוראת קבע',
        };

        return statusMap[MovmemntType] || 'לא ידוע';
    }
    const loadMovements = async () => {
        try {
            const data = await getAllMovements();
            setMovements(data);
            countMoneyInKopa(data)
            console.log(data)
        }
        catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.log(err)
        }
    };

    const handleAddClick = () => {
        setIsEdit(false);
        setShowModal(true);
    };

    const handleEditClick = (movement) => {
        setIsEdit(true);
        setid(movement.id);
        setCurrentMovement({
            ...movement,
            amount: format(movement.amount),
        });
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        loadMovements();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentMovement((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const submitMovement = async (e) => {
        console.log(currentMovement.type)
        e.preventDefault();
        try {
            if (isEdit) {
                await updateFundMovement(id, currentMovement.personId, currentMovement.amount.replace(/,/g, ''), currentMovement.type, currentMovement.description, currentMovement.date, currentMovement.typeOfPayment,   // חדש
                    currentMovement.currency);
            } else {
                await createFundMovement(currentMovement.personId, currentMovement.amount.replace(/,/g, ''), currentMovement.type, currentMovement.description, currentMovement.date, currentMovement.typeOfPayment,   // חדש
                    currentMovement.currency);
            }
            if (currentMovement.type == "donation") {
                let person
                try {
                    person = await GetPersonById(currentMovement.personId)
                }
                catch (e) {

                }
                ShowPdf(currentMovement, person)
            }
            handleClose();
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.error('שגיאה בשמירת תנועה:', err);
        }
    };
    const ShowPdf = async (currentMovement, person) => {
        const container = document.getElementById('pdf-container');
        if (pdfVisible) {
            container.innerHTML = '';
            setPdfVisible(false);
            return;
        }
        console.log("dsafgf")
        const url = await generateDonationReport(currentMovement, person);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'סגור דוח';
        closeButton.className = 'btn btn-danger mb-3'; // Bootstrap classes
        closeButton.onclick = () => {
            container.innerHTML = '';
            setPdfVisible(false);
        };

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = '100%';
        iframe.height = '600px';
        iframe.style.border = 'none';

        container.innerHTML = '';
        container.appendChild(closeButton);
        container.appendChild(iframe);

        setPdfVisible(true);
    };

    const handleIdBlur = async (id) => {
        console.log("on")
        try {
            const existingPerson = await GetPersonById(id);
            console.log(existingPerson)
            if (!existingPerson) {
                setShowPersonModal(true);
            }
        }
        catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.log(err)
        }
    }
    const closePdfIfOpen = () => {
        if (pdfVisible) {
            setPdfVisible(false);
            const container = document.getElementById('pdf-container');
            if (container) container.innerHTML = '';
        }
    };

    return (
        <>
            <div className='container pt-5'>
                <div className='header-fund '>
                    <Button variant="warning" className="mb-3" onClick={handleAddClick}>
                        הוסף תנועה
                    </Button>
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
                                        setMinAmount('');
                                        closePdfIfOpen()
                                        setMaxAmount('');
                                    }}
                                >
                                    <option value="">-- אין סינון --</option>
                                    <option value="borrowerId">תעודת זהות</option>
                                    <option value="name">שם</option> {/* הוספתי כאן */}
                                    <option value="amount">טווח סכום תשלום</option>
                                    <option value="dateRange">טווח תאריכים</option>
                                </Form.Select>
                            </div>
                            {selectedFilter === 'dateRange' && (
                                <>
                                    <div className="col">
                                        <Form.Label>מתאריך:</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => {
                                                setFromDate(e.target.value); closePdfIfOpen()
                                            }}
                                        />
                                    </div>
                                    <div className="col">
                                        <Form.Label>עד תאריך:</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => { setToDate(e.target.value); closePdfIfOpen() }}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedFilter === 'borrowerId' ? (
                                <div className="col">
                                    <Form.Label>הזן ערך לסינון:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={filterValue}
                                        onChange={(e) => { setFilterValue(e.target.value); closePdfIfOpen() }}
                                        placeholder={'לדוגמה: 123456789'}
                                    />
                                </div>
                            ) : null}


                            {selectedFilter === 'name' ? (
                                <div className="col">
                                    <Form.Label>הזן ערך לסינון:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={filterValue}
                                        onChange={(e) => { setFilterValue(e.target.value); closePdfIfOpen() }}
                                        placeholder={'לדוגמה: ישראל ישראלי'}
                                    />
                                </div>
                            ) : null}
                            {selectedFilter === 'amount' ? (
                                <>
                                    <div className="col">
                                        <Form.Label>מסכום:</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={minAmount}
                                            onChange={(e) => { setMinAmount(e.target.value); closePdfIfOpen() }}
                                        />

                                    </div>
                                    <div className="col">
                                        <Form.Label>עד סכום:</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={maxAmount}
                                            onChange={(e) => { setMaxAmount(e.target.value); closePdfIfOpen() }}
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

                    {!showMoney && filteredmovements.length > 0 ? (
                        filteredmovements.every(m => m.personId === filteredmovements[0].personId) ? (
                            <>
                                <span>                                              סך הכל תנועות לאדם:
                                    {Object.entries(countPersonBalance(filteredmovements[0].personId)).map(([currency, amount]) => {
                                        console.log(currency, amount)
                                        const symbol = currency === 'shekel' ? '₪' : currency === 'dollar' ? '$' : currency;
                                        return (
                                            <span key={currency} style={{ marginLeft: '10px' }}>
                                                {amount.toLocaleString()} {symbol}
                                            </span>
                                        );
                                    })}
                                </span>
                                <Button onClick={() => handleShowPdf(filteredmovements)}>
                                    {pdfVisible ? 'סגור דוח' : 'הצג דוח PDF'}
                                </Button>
                            </>
                        ) : selectedFilter === 'dateRange' && fromDate && toDate ? (
                            <Button
                                className="mb-3"
                                variant="success"
                                onClick={() => handleShowPdf(filteredmovements)}
                            >
                                {pdfVisible ? 'סגור דוח' : 'הצג דוח לפי תאריכים'}
                            </Button>
                        ) : (
                            <Button variant="warning" className="mb-3" onClick={() => setShowMoney(true)}>
                                הצג כסף בגמח
                            </Button>
                        )
                    ) : (
                        <div dir="rtl" style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'green' }}>
                            {console.log(MoneyInGmach)}
                            {Object.entries(MoneyInGmach).map(([currency, amount]) => {
                                const symbol = currency === 'shekel' ? '₪' : currency === 'dollar' ? '$' : currency;
                                return (
                                    <div key={currency}>
                                        {`יש ${amount.toLocaleString()} ${symbol} בגמ"ח`}
                                    </div>
                                );
                            })}
                        </div>

                    )}

                </div>
                <div id="pdf-container" className="mt-4"></div>
                {!pdfVisible &&
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>סכום</th>
                                <th>סוג</th>
                                <th>תיאור</th>
                                <th>תאריך</th>
                                <th>ת"ז</th>
                                <th>אמצעי תשלום</th>
                                <th>שם</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredmovements.map((mov) => (
                                <tr key={mov.id}>
                                    <td>{formatAmount(mov.amount, mov.currency)}</td>
                                    <td>{translateMovmemntType(mov.type)}</td>
                                    <td>{mov.description}</td>
                                    <td>{mov.date}</td>
                                    <td>{mov.personId}</td>
                                    <td>{translatePaymentType(mov.typeOfPayment)}</td>
                                    <td>{mov.person?.fullName}</td>
                                    <td>
                                        {(mov.type == 'donation' || mov.type == 'manual_adjustment') && <Button size="sm" onClick={() => handleEditClick(mov)}>
                                            ערוך
                                        </Button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>}

                <Modal show={showModal} onHide={handleClose} dir="rtl">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEdit ? 'עריכת תנועה' : 'הוספת תנועה'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={submitMovement} dir="rtl" className="text-end">
                            <Form.Group className="mb-2">
                                <Form.Label className="float-end">סכום</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="amount"
                                    value={currentMovement.amount}
                                    onChange={handleAmountChange}
                                    required
                                    style={{ textAlign: 'right' }}
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="float-end">סוג</Form.Label>
                                <Form.Select
                                    name="type"
                                    value={currentMovement.type}
                                    onChange={handleChange}
                                    required
                                    style={{ textAlign: 'right' }}
                                >
                                    <option value="manual_adjustment">התאמה ידנית</option>
                                    <option value="donation">תרומה</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="float-end">תיאור</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="description"
                                    value={currentMovement.description}
                                    onChange={handleChange}
                                    style={{ textAlign: 'right' }}
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="float-end">תאריך</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="date"
                                    value={currentMovement.date}
                                    onChange={handleChange}
                                    required
                                    style={{ textAlign: 'right' }}
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="float-end">אמצעי תשלום</Form.Label>
                                <Form.Select
                                    name="typeOfPayment"
                                    value={currentMovement.typeOfPayment}
                                    onChange={handleChange}
                                    required
                                    style={{ textAlign: 'right' }}
                                >
                                    <option value="check">צ'ק</option>
                                    <option value="Standing_order">הוראת קבע</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="float-end">מטבע</Form.Label>
                                <Form.Select
                                    name="currency"
                                    value={currentMovement.currency}
                                    onChange={handleChange}
                                    required
                                    style={{ textAlign: 'right' }}
                                >
                                    <option value="shekel">שקל</option>
                                    <option value="dollar">דולר</option>
                                </Form.Select>
                            </Form.Group>

                            {currentMovement.type !== 'manual_adjustment' && (
                                <Form.Group>
                                    <Form.Label className="float-end">תעודת זהות</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="personId"
                                        value={currentMovement.personId}
                                        onChange={handleChange}
                                        onBlur={() => handleIdBlur(currentMovement.personId)}
                                        style={{ textAlign: 'right' }}
                                    />
                                </Form.Group>
                            )}

                            <div className="text-end mt-3">
                                <Button type="submit" variant="primary">
                                    {isEdit ? 'עדכן' : 'הוסף'}
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>

                <ModelNewPerson showModal={showPersonModal} setShowModal={setShowPersonModal} />
            </div>
        </>
    );
}
