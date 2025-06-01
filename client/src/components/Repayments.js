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
function Repayment() {
    const [repayments, setRepayments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedRepayment, setSelectedRepayment] = useState({
        loanId: '',
        amount: '',
        paidDate: '',
        notes: "",
        Guarantor: false
    });
    const [Id, setId] = useState('')
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [personId, setpersonId] = useState('')
    const fetchRepayments = async () => {
        try {
            const res = await GetAllRepayments();
            console.log(res)
            setRepayments(res);
        } catch (err) {
            console.error(err);
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
                setShowAddPersonModal(true);
            }
            else {
                const res2 = await GetLoansByPerson(personId)
                const loan = res2.find((loan) => loan.status == 'pending' || loan.status == 'partial')
                setSelectedRepayment({ ...selectedRepayment, loanId: loan.id })
            }


        }
        catch (e) {
            console.log(e)
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
            console.error('שגיאה בשמירה:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את התשלום?')) return;
        try {
            await DeleteRepayment(id);
            await fetchRepayments();
        } catch (err) {
            console.error('שגיאה במחיקה:', err);
        }
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-start mb-3">
                <Button variant="primary" onClick={() => handleShowModal()}>הוסף תשלום</Button>
            </div>

            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>#</th>
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
                    {repayments.map((repayment, index) => (
                        <tr key={repayment.id}>
                            <td>{index + 1}</td>
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
            <ModelNewPerson showModal={showAddPersonModal} setShowModal={setShowAddPersonModal} />

        </div>
    );
}

export default Repayment;
