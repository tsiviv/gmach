import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import {
    getAllTurns,
    createTurn,
    deleteTurn,
    updateTurn,
} from '../servieces/Turns';
import ModelNewPerson from './ModelNewPerson';
import { GetPersonById } from '../servieces/People';
import { useNavigate } from 'react-router-dom';
import { formatAmount,format } from './helper'

export default function Turns() {
    const [turns, setTurns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentTurn, setCurrentTurn] = useState({
        id: null,
        personId: '',
        amount: '',
        repaymentType: 'once',
        description: '',
        date: '',
    });
    const navigate = useNavigate();
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [error, setError] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');

    const filteredTurns = turns.filter((turn) => {
        if (!selectedFilter) return true;
        if (selectedFilter === 'personId') {
            return turn.personId.toString().includes(filterValue);
        }
        if (selectedFilter === 'amount') {
            const amount = Number(turn.amount);
            const min = Number(minAmount) || 0;
            const max = Number(maxAmount) || Infinity;
            return amount >= min && amount <= max;
        }
        return true;
    });

    useEffect(() => {
        loadTurns();
    }, []);

    const loadTurns = async () => {
        try {
            const data = await getAllTurns();
            setTurns(data);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentTurn((prev) => ({ ...prev, [name]: value }));
    };

    const handleIdBlur = async () => {
        try {
            const existingPerson = await GetPersonById(currentTurn.personId);
            if (!existingPerson) {
                setShowAddPersonModal(true);
                setCurrentTurn({ ...currentTurn, ['personId']: '' });
            }
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../');
            }
        }
    };

    const handleAdd = () => {
        setCurrentTurn({
            id: null,
            personId: '',
            amount: '',
            repaymentType: 'once',
            description: '',
            date: '',
        });
        setIsEdit(false);
        setShowModal(true);
    };

    const handleEdit = (turn) => {
        setCurrentTurn({
            id: turn.id,
            personId: turn.personId,
            amount: format(turn.amount),
            repaymentType: turn.repaymentType,
            description: turn.description,
            date: turn.date ? turn.date.split('T')[0] : '',
        });
        setIsEdit(true);
        setShowModal(true);
    };
    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, ''); // הסרת פסיקים
        if (!/^\d*$/.test(rawValue)) return; // חסום תווים לא מספריים

        const numericValue = Number(rawValue);
        const formattedValue = format(numericValue);
        setCurrentTurn((prev) => ({
            ...prev,
            amount: formattedValue,
        }));
    };
    const handleDelete = async (id) => {
        if (window.confirm('אתה בטוח שברצונך למחוק את התנועה הזו?')) {
            try {
                await deleteTurn(id);
                loadTurns();
            } catch (err) {
                alert('שגיאה במחיקת תנועה');
            }
        }
    };

    const handleClose = () => {
        setShowModal(false);
        loadTurns();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentTurn.personId) {
            setError('יש להזין תעודת זהות');
            return;
        }
        if (!currentTurn.amount) {
            setError('יש להזין סכום');
            return;
        }
        try {
            if (isEdit) {
                await updateTurn(currentTurn.id, currentTurn);
            } else {
                await createTurn(currentTurn);
            }
            handleClose();
        } catch (err) {
            setError(err?.response?.data?.error || 'שגיאה בלתי צפויה');
        }
    };

    return (
        <div className="container pt-5">
            <div className="header-turns mb-3 d-flex justify-content-between align-items-center">
                <Button variant="warning" onClick={handleAdd}>
                    הוסף תור
                </Button>

                <Form className="d-flex align-items-center">
                    <Form.Group className="me-2">
                        <Form.Label>בחר שדה לסינון:</Form.Label>
                        <Form.Select
                            value={selectedFilter}
                            onChange={(e) => {
                                setSelectedFilter(e.target.value);
                                setFilterValue('');
                                setMinAmount('');
                                setMaxAmount('');
                            }}
                        >
                            <option value="">-- אין סינון --</option>
                            <option value="personId">תעודת זהות</option>
                            <option value="amount">טווח סכום</option>
                        </Form.Select>
                    </Form.Group>

                    {selectedFilter === 'personId' && (
                        <Form.Group className="me-2">
                            <Form.Control
                                type="text"
                                placeholder="לדוגמה: 123456789"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                            />
                        </Form.Group>
                    )}

                    {selectedFilter === 'amount' && (
                        <>
                            <Form.Group className="me-2">
                                <Form.Control
                                    type="number"
                                    placeholder="מסכום"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                />
                            </Form.Group>
                            <Form.Group className="me-2">
                                <Form.Control
                                    type="number"
                                    placeholder="עד סכום"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                />
                            </Form.Group>
                        </>
                    )}

                    <Button
                        variant="outline-secondary"
                        onClick={() => {
                            setSelectedFilter('');
                            setFilterValue('');
                            setMinAmount('');
                            setMaxAmount('');
                        }}
                    >
                        נקה סינון
                    </Button>
                </Form>
            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>מספר תור</th>
                        <th>ת"ז</th>
                        <th>סכום</th>
                        <th>סוג תשלום</th>
                        <th>תיאור</th>
                        <th>תאריך</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTurns.map((turn) => (
                        <tr key={turn.id}>
                            <td>{turn.id}</td>
                            <td>{turn.personId}</td>
                            <td>{format(turn.amount)}</td>
                            <td>{turn.repaymentType === 'once' ? 'חד פעמי' : 'חודשי'}</td>
                            <td>{turn.description}</td>
                            <td>{turn.date ? turn.date.split('T')[0] : ''}</td>
                            <td>
                                <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(turn)}>
                                    ערוך
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(turn.id)}>
                                    מחק
                                </Button>
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
                    <Form onSubmit={handleSubmit} className="text-end">
                        <Form.Group className="mb-2">
                            <Form.Label>תעודת זהות</Form.Label>
                            <Form.Control
                                type="text"
                                name="personId"
                                value={currentTurn.personId}
                                onChange={handleChange}
                                onBlur={handleIdBlur}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>סכום</Form.Label>
                            <Form.Control
                                type="text"
                                name="amount"
                                value={currentTurn.amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>סוג תשלום</Form.Label>
                            <Form.Select
                                name="repaymentType"
                                value={currentTurn.repaymentType}
                                onChange={handleChange}
                                required
                            >
                                <option value="once">חד פעמי</option>
                                <option value="monthly">חודשי</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>תיאור</Form.Label>
                            <Form.Control
                                type="text"
                                name="description"
                                value={currentTurn.description}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>תאריך</Form.Label>
                            <Form.Control
                                type="date"
                                name="date"
                                value={currentTurn.date}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                        {error && <p className="error text-danger">{error}</p>}
                        <Button type="submit" className="mt-3">
                            {isEdit ? 'עדכן' : 'הוסף'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <ModelNewPerson showModal={showAddPersonModal} setShowModal={setShowAddPersonModal} />
        </div>
    );
}
