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
import ModelNewPerson from './ModelNewPerson';
export default function FundMovementsPage({ isAdmin }) {
    const [movements, setMovements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [id, setid] = useState('')
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

    const loadMovements = async () => {
        const data = await getAllMovements();
        setMovements(data);
    };

    const handleAddClick = () => {
        setIsEdit(false);
        setCurrentMovement({
            amount: '',
            type: '',
            description: '',
            date: '',
            personId: ''
        });
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

    const submitMovement = async () => {
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
            <Button className="mb-3" onClick={handleAddClick}>
                הוסף תנועה
            </Button>

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
                            <td>{mov.type}</td>
                            <td>{mov.description}</td>
                            <td>{mov.date}</td>
                            <td>{mov.personId}</td>
                            <td>
                                <Button size="sm" onClick={() => handleEditClick(mov)}>
                                    ערוך
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
                                <option value="donation">תרומה</option>
                                <option value="manual_adjustment">התאמה ידנית</option>
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
                                    required
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
