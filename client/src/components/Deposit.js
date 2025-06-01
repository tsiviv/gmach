import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import {
    getAllDeposit,
    createDeposit, getDepositByPersonId
} from '../servieces/Deposit'; // נניח שקיים service מתאים
import ModelNewPerson from './ModelNewPerson';
import { GetPersonById } from '../servieces/People';
export default function Deposit() {
    const [deposits, setDeposits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentDeposit, setCurrentDeposit] = useState({
        PeopleId: '',
        deposit_amount: '',
        pull_amount: ''
    });
    const [sachakol, setsachakol] = useState(0)
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [error, setError] = useState('')
    useEffect(() => {
        loadDeposits();
    }, []);
    const SachDeposit = (data) => {
        let sum = 0
        data.forEach((dep) => {
            sum += dep.deposit_amount
            sum -= dep.pull_amount
        })
        console.log(sum)
        setsachakol(sum)
    }
    const loadDeposits = async () => {
        const data = await getAllDeposit();
        console.log(data)
        setDeposits(data);
        SachDeposit(data)
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentDeposit((prev) => ({ ...prev, [name]: value }));
    };
    const handleIdBlur = async () => {
        console.log("on")
        try {
            const existingPerson = await GetPersonById(currentDeposit.PeopleId);
            console.log(existingPerson)
            if (!existingPerson) {
                setShowAddPersonModal(true);
                setCurrentDeposit({ ...currentDeposit, ['PeopleId']: '' });
            }
            else {
                const dep = await getDepositByPersonId(currentDeposit.PeopleId)
                console.log(dep)
                setCurrentDeposit({
                    ...currentDeposit,
                    deposit_amount: dep.deposit_amount,
                    pull_amount: dep.pull_amount
                });
            }
        }
        catch (e) {
            console.log(e)
        }
    }
    const handleAdd = () => {
        setCurrentDeposit({
            PeopleId: '',
            deposit_amount: '',
            pull_amount: ''
        });
        setIsEdit(false);
        setShowModal(true);
    };

    const handleEdit = (deposit) => {
        setCurrentDeposit({ ...deposit });
        setIsEdit(true);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        loadDeposits();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (currentDeposit.pull_amount > currentDeposit.deposit_amount) {
            setError('סבום המשיכה גבוה מסכום ההפקדה')
            return
        }
        await createDeposit(currentDeposit.PeopleId, currentDeposit.pull_amount, currentDeposit.deposit_amount);

        handleClose();
    };

    return (
        <div className="p-3">
            <div className='header-fund'>
                <Button className="mb-3" onClick={handleAdd}>
                    הוסף הפקדה
                </Button>
                <div dir="rtl" style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'green' }}>
                   יש סכום של  {sachakol} ₪ מהפקדות
                </div>            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ת"ז</th>
                        <th>שם</th>
                        <th>סכום הפקדה</th>
                        <th>סכום משיכה</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {deposits.map((d) => (
                        <tr key={d.id}>
                            <td>{d.PeopleId}</td>
                            <td>{d.person.fullName}</td>
                            <td>{d.deposit_amount}</td>
                            <td>{d.pull_amount}</td>
                            <td>
                                <Button size="sm" onClick={() => handleEdit(d)}>
                                    ערוך
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleClose} dir="rtl">
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? 'עריכת הפקדה' : 'הוספת הפקדה'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit} className="text-end">
                        <Form.Group>
                            <Form.Label>תעודת זהות</Form.Label>
                            <Form.Control
                                type="text"
                                name="PeopleId"
                                value={currentDeposit.PeopleId}
                                onChange={handleChange}
                                onBlur={() => handleIdBlur()}
                                required
                            />
                        </Form.Group>
                        {console.log(currentDeposit)
                        }                        <Form.Group>
                            <Form.Label>סכום הפקדה</Form.Label>
                            <Form.Control
                                type="number"
                                name="deposit_amount"
                                value={currentDeposit.deposit_amount}
                                onChange={handleChange}
                                onBlur={() => setError('')}
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>סכום משיכה</Form.Label>
                            <Form.Control
                                type="number"
                                name="pull_amount"
                                value={currentDeposit.pull_amount}
                                onChange={handleChange}
                                onBlur={() => setError('')}
                            />
                        </Form.Group>
                        {error && <p className='error'>{error}</p>}
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
