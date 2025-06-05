import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Form } from 'react-bootstrap';
import {
    getAllMovements,
    createFundMovement,
    updateFundMovement
} from '../servieces/FundMovement'
import {
    CreatePerson,
    GetPersonById
} from '../servieces/People';
import '../styles/fund.css'
import ModelNewPerson from './ModelNewPerson';
import { useNavigate } from 'react-router-dom';

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
        personId: ''
    });
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
            return movement.person.id.toString().includes(filterValue);
        }


        if (selectedFilter === 'date') {
            console.log(fromDate, "F", movement.date)
            if (!fromDate) return true; // אין תאריך לסינון
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
    useEffect(() => {
        loadMovements();
    }, []);
    const countMoneyInKopa = (data) => {
        let sum = 0;

        data.forEach(element => {
            const type = (element.type || '').toLowerCase().trim();
            const amount = Number(element.amount) || 0;

            if (type === 'manual_adjustment' || type === 'donation' || type === 'deposit' || type == 'repayment_received') {
                sum += amount;
            } else {
                sum -= amount;
            }
        });

        setMoneyInGmach(sum);
    }

    function translateMovmemntType(MovmemntType) {
        const statusMap = {
            repayment_received: 'תשלום על הלוואה',
            loan_given: 'הלוואה',
            deposit: 'הפקדה',
            pull_deposit: 'משיכה',
            donation: 'תרומה',
            manual_adjustment: 'הפקדת מנהל',
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
        setCurrentMovement({ ...movement });
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
                await updateFundMovement(id, currentMovement.personId, currentMovement.amount, currentMovement.type, currentMovement.description, currentMovement.date);
            } else {
                await createFundMovement(currentMovement.personId, currentMovement.amount, currentMovement.type, currentMovement.description, currentMovement.date);
            }
            handleClose();
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.error('שגיאה בשמירת תנועה:', err);
        }
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
                                    }}
                                >
                                    <option value="">-- אין סינון --</option>
                                    <option value="borrowerId">תעודת זהות</option>
                                    <option value="date">תאריך תשלום</option>
                                    <option value="amount">טווח סכום תשלום  </option>
                                </Form.Select>
                            </div>

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
                                        <Form.Label> תאריך:</Form.Label>
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
                    {!showMoney ? <Button variant="warning" className="mb-3" onClick={() => { setShowMoney(true) }}>הצג כסף בגמח</Button>
                        : <div dir="rtl" style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'green' }}>
                            יש {MoneyInGmach.toLocaleString()} ₪ בגמח
                        </div>}        </div>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>סכום</th>
                            <th>סוג</th>
                            <th>תיאור</th>
                            <th>תאריך</th>
                            <th>ת"ז</th>
                            <th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredmovements.map((mov) => (
                            <tr key={mov.id}>
                                <td>{mov.amount}</td>
                                <td>{translateMovmemntType(mov.type)}</td>
                                <td>{mov.description}</td>
                                <td>{mov.date}</td>
                                <td>{mov.personId}</td>
                                <td>
                                    {!(mov.type == 'loan_given' || mov.type == 'repayment_received' || mov.type == 'deposit' || mov.type == 'pull_deposit' || mov.type == 'repayment') && <Button size="sm" onClick={() => handleEditClick(mov)}>
                                        ערוך
                                    </Button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <Modal show={showModal} onHide={handleClose} dir="rtl">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEdit ? 'עריכת תנועה' : 'הוספת תנועה'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={submitMovement} className="text-end">
                            <Form.Group>
                                <Form.Label>סכום</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="amount"
                                    value={currentMovement.amount}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>סוג</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="type"
                                    value={currentMovement.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="manual_adjustment">התאמה ידנית</option>
                                    <option value="donation">תרומה</option>
                                </Form.Control>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>תיאור</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="description"
                                    value={currentMovement.description}
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>תאריך</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="date"
                                    value={currentMovement.date}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            {currentMovement.type !== 'manual_adjustment' && (
                                <Form.Group>
                                    <Form.Label>תעודת זהות</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="personId"
                                        value={currentMovement.personId}
                                        onChange={handleChange}
                                        onBlur={() => handleIdBlur(currentMovement.personId)}
                                    />
                                </Form.Group>
                            )}

                            <Button type="submit" variant="primary" className="mt-3">
                                {isEdit ? 'עדכן' : 'הוסף'}
                            </Button>
                        </Form>
                    </Modal.Body>
                </Modal>
                <ModelNewPerson showModal={showPersonModal} setShowModal={setShowPersonModal} />
            </div>
        </>
    );
}
