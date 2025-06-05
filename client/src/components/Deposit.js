import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import {
    getAllDeposit,
    createDeposit, getDepositByPersonId
} from '../servieces/Deposit'; // נניח שקיים service מתאים
import ModelNewPerson from './ModelNewPerson';
import { GetPersonById } from '../servieces/People';
import { useNavigate } from 'react-router-dom';

export default function Deposit() {
    const [deposits, setDeposits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentDeposit, setCurrentDeposit] = useState({
        PeopleId: '',
        deposit_amount: '',
        pull_amount: ''
    });
    const navigate = useNavigate();
    const [sachakol, setsachakol] = useState(0)
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [error, setError] = useState('')
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const filtereddeposits = deposits.filter((deposit) => {
        if (!selectedFilter) return true;
    
        if (selectedFilter === 'borrowerId') {
            return deposit.PeopleId.toString().includes(filterValue);
        }
    
        if (selectedFilter === 'pull_amount') {
            const amount = Number(deposit.pull_amount);
            const min = Number(minAmount) || 0;
            const max = Number(maxAmount) || Infinity;
            return amount >= min && amount <= max;
        }
        if (selectedFilter === 'deposit_amount') {
            const amount = Number(deposit.deposit_amount);
            const min = Number(minAmount) || 0;
            const max = Number(maxAmount) || Infinity;
            return amount >= min && amount <= max;
        }
        return true;
    });
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
        try {
            const data = await getAllDeposit();
            console.log(data)
            setDeposits(data);
            SachDeposit(data)
        }
        catch(err){
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
        }

        
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
        catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.log(err)
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
        <div className="container pt-5">
            <div className='header-fund'>
                <Button variant="warning" className="mb-3 ms-5" onClick={handleAdd}>
                    הוסף הפקדה
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
                                    setMinAmount('')
                                    setMaxAmount('')
                                }}
                            >
                                <option value="">-- אין סינון --</option>
                                <option value="borrowerId">תעודת זהות</option>
                                <option value="deposit_amount">טווח סכום הפקדה  </option>
                                <option value="pull_amount">טווח סכום משיכה  </option>
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

                        {selectedFilter === 'deposit_amount'||selectedFilter === 'pull_amount' ? (
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
                                }}
                            >
                                נקה סינון
                            </Button>
                        </div>
                    </div>
                </Form>
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
                    {filtereddeposits.map((d) => (
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
