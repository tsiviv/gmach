import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { FaEdit, FaTrash } from 'react-icons/fa';
import {
    GetAllRepayments,
    CreateRepayment,
    UpdateRepayment,
    DeleteRepayment
} from '../servieces/Repaments';
import ModelNewPerson from "./ModelNewPerson";
import { GetLoanStatusSummary } from '../servieces/Loans'
import { GetPersonById, GetLoansByPerson } from '../servieces/People'
import { useNavigate } from 'react-router-dom';

function Repayment() {
    const [repayments, setRepayments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const navigate = useNavigate();
    const [selectedRepayment, setSelectedRepayment] = useState({
        loanId: '',
        amount: '',
        paidDate: '',
        notes: "",
        Guarantor: false
    });
    const [Id, setId] = useState('')
    const [personId, setpersonId] = useState('')
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const filteredRepayments = repayments.filter((repayment) => {
        if (!selectedFilter) return true;
    
        if (selectedFilter === 'borrowerId') {
            return repayment.loan.borrowerId.toString().includes(filterValue);
        }
    
        if (selectedFilter === 'name') {
            return repayment.loan.borrower.fullName.toLowerCase().includes(filterValue.toLowerCase());
        }
    
        if (selectedFilter === 'date') {
            const paidDate = new Date(repayment.paidDate);
            const from = fromDate ? new Date(fromDate) : null;
            const to = toDate ? new Date(toDate) : null;
            return (!from || paidDate >= from) && (!to || paidDate <= to);
        }
    
        if (selectedFilter === 'amount') {
            const amount = Number(repayment.amount);
            const min = Number(minAmount) || 0;
            const max = Number(maxAmount) || Infinity;
            return amount >= min && amount <= max;
        }
    
        return true;
    });
    
    const fetchRepayments = async () => {
        try {
            const res = await GetAllRepayments();
            console.log(res)
            setRepayments(res);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
        }
    };

    useEffect(() => {
        fetchRepayments();
    }, []);
    const handleIdBlur = async () => {
        console.log("on")
        try {
            const existingPerson = await GetPersonById(personId);
            console.log(existingPerson)
            if (!existingPerson) {
                alert('לקוח לא קיים')
                setpersonId('')
                return
            }
            else {
                const res2 = await GetLoansByPerson(personId)
                const loan = res2.find((loan) => loan.status == 'pending' || loan.status == 'partial' || loan.status == 'overdue' || loan.status == 'late_paid')
                console.log(loan)
                if (!loan) {
                    alert("ללקוח זה אין הלוואה פעילה")
                    setpersonId('')
                    return
                }
                setSelectedRepayment({ ...selectedRepayment, loanId: loan.id })
            }


        }
        catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
        }
    }
    const handleShowModal = (repayment = null) => {
        if (repayment) {
            setSelectedRepayment({
                loanId: repayment.loanId,
                amount: repayment.amount,
                paidDate: repayment.paidDate,
                notes: repayment.notes,
                Guarantor: repayment.Guarantor
            });
            setIsEdit(true);
            setId(repayment.id)
        } else {
            setSelectedRepayment({
                loanId: '',
                amount: '',
                paidDate: '',
                notes: "",
                Guarantor: false
            });
            setIsEdit(false);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);
    function translaterepaymentType(repaymentType) {
        const statusMap = {
            monthly: 'חודשי',
            once: 'חד פעמי',
        };

        return statusMap[repaymentType] || 'לא ידוע';
    }
    const handleSave = async () => {
        try {
            if (isEdit) {
                await UpdateRepayment(Id, selectedRepayment.loanId, selectedRepayment.Guarantor, selectedRepayment.amount, selectedRepayment.paidDate, selectedRepayment.notes);
            } else {
                await CreateRepayment(selectedRepayment.loanId, selectedRepayment.Guarantor, selectedRepayment.amount, selectedRepayment.paidDate, selectedRepayment.notes);
            }
            await fetchRepayments();
            handleCloseModal();
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את התשלום?')) return;
        try {
            await DeleteRepayment(id);
            await fetchRepayments();
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.error('שגיאה במחיקה:', err);
        }
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-start mb-3">
                <Button variant="primary" onClick={() => handleShowModal()}>הוסף תשלום</Button>
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
                                    setToDate('');
                                }}
                            >
                                <option value="">-- אין סינון --</option>
                                <option value="borrowerId">תעודת זהות</option>
                                <option value="name">שם הלווה</option>
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
                                    <Form.Label>מתאריך:</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                    />
                                </div>
                                <div className="col">
                                    <Form.Label>עד תאריך:</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
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
                                    setToDate('');
                                    setMaxAmount('')
                                    setMinAmount('')
                                }}
                            >
                                נקה סינון
                            </Button>
                        </div>
                    </div>
                </Form>

            </div>

            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>ת.ז. לווה</th>
                        <th>שם הלווה</th>
                        <th>סכום תשלום</th>
                        <th>תאריך</th>
                        <th>סכום הלוואה</th>
                        <th>חודשי\חד פעמי</th>
                        <th>סכום חודשי</th>
                        <th>תאריך התחלה</th>
                        <th>פעולות</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredRepayments.map((repayment, index) => (
                        <tr key={repayment.id}>
                            <td>{index + 1}</td>
                            <td>{repayment.loan.borrowerId}</td>
                            <td>{repayment.loan.borrower.fullName} </td>
                            <td>{repayment.amount} ₪</td>
                            <td>{new Date(repayment.paidDate).toLocaleDateString()}</td>
                            <td>{repayment.loan?.amount || '-'}</td>
                            <td>{translaterepaymentType(repayment.loan?.repaymentType) || '-'}</td>
                            <td>{repayment.loan?.amountInMonth == "null" ? '-' : repayment.loan?.amountInMonth}</td>
                            <td>{repayment.loan?.startDate ? new Date(repayment.loan.startDate).toLocaleDateString() : '-'}</td>
                            <td>
                                <FaEdit
                                    size={18}
                                    style={{ cursor: 'pointer', marginRight: '10px' }}
                                    onClick={() => handleShowModal(repayment)}
                                />
                                <FaTrash
                                    size={18}
                                    style={{ cursor: 'pointer', color: 'red' }}
                                    onClick={() => handleDelete(repayment.id)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>

            </Table>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? 'עריכת תשלום' : 'הוספת תשלום חדש'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>תעודת זהות</Form.Label>
                            <Form.Control
                                type="number"
                                value={personId}
                                onChange={(e) => setpersonId(e.target.value)}
                                onBlur={() => handleIdBlur()}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>משולם על ידי </Form.Label>
                            <Form.Select
                                name="Guarantor"
                                value={selectedRepayment.Guarantor}
                                onChange={(e) => setSelectedRepayment({ ...selectedRepayment, Guarantor: e.target.value })}
                            >
                                <option value={false} >הלווה</option>
                                <option value={true}>ערב</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>סכום</Form.Label>
                            <Form.Control
                                type="number"
                                value={selectedRepayment.amount}
                                onChange={(e) => setSelectedRepayment({ ...selectedRepayment, amount: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>תאריך </Form.Label>
                            <Form.Control
                                type="date"
                                name="paidDate"
                                value={
                                    selectedRepayment.paidDate
                                        ? new Date(selectedRepayment.paidDate).toISOString().split('T')[0]
                                        : ''
                                }
                                onChange={(e) => setSelectedRepayment({ ...selectedRepayment, paidDate: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>הערות</Form.Label>
                            <Form.Control
                                type="text"
                                value={selectedRepayment.notes}
                                onChange={(e) => setSelectedRepayment({ ...selectedRepayment, notes: e.target.value })}
                            />
                        </Form.Group>

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>ביטול</Button>
                    <Button variant="primary" onClick={handleSave}>שמור</Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
}

export default Repayment;
