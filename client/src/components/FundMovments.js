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
export default function FundMovementsPage({ isAdmin }) {
    const [movements, setMovements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [id, setid] = useState('')
    const [MoneyInGmach, setMoneyInGmach] = useState(0)
    const [currentMovement, setCurrentMovement] = useState({
        amount: '',
        type: 'manual_adjustment',
        description: '',
        date: '',
        personId: ''
    });

    const [showPersonModal, setShowPersonModal] = useState(false);

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
    function translateLoanStatus(status) {
        const statusMap = {
            pending: 'ממתינה',
            partial: 'שולמה חלקית',
            paid: 'שולמה',
            overdue: 'פיגור',
            late_paid: 'שולמה באיחור',
            PaidBy_Gauartantor: 'שולמה על ידי ערב',
        };

        return statusMap[status] || 'לא ידוע';
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
        catch (e) {
            console.log(e)
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
        catch (e) {
            console.log(e)
        }
    }

    return (
        <>
            <div className='header-fund'>
                <Button className="mb-3" onClick={handleAddClick}>
                    הוסף תנועה
                </Button>
                <div dir="rtl" style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'green' }}>
                    יש {MoneyInGmach.toLocaleString()} ₪ בגמח
                </div>            </div>
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
                    {movements.map((mov) => (
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
        </>
    );
}
