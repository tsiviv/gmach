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
import { formatAmount, format } from './helper'

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
    const [error, setError] = useState('');
    const [Id, setId] = useState('')
    const [personId, setpersonId] = useState('')
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [loanguarantors, setloanguarantors] = useState([])
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterLoans, setFilterLoans] = useState([]);
    const [SelectedLoan, setSelectedLoan] = useState()
    const [pageSize] = useState(50); // מספר רשומות לדף
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

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (!/^\d*$/.test(rawValue)) return;

        const numericValue = Number(rawValue);

        const maxAmount = SelectedLoan ? Number(SelectedLoan.amount) : Infinity;

        if (numericValue > maxAmount) {
            setError(`הסכום לא יכול להיות גדול מסכום ההלוואה (${format(maxAmount)})`);
            return;
        }

        setError('');

        const formattedValue = format(numericValue);
        setSelectedRepayment((prev) => ({
            ...prev,
            amount: formattedValue,
        }));
    };

    const fetchRepayments = async () => {
        try {
            const res = await GetAllRepayments(currentPage, pageSize);
            setTotalPages(res.totalPages)
            setRepayments(res.data);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
        }
    };

    useEffect(() => {
        fetchRepayments();
    }, [currentPage]);
    const handleIdBlur = async () => {
        try {
            const existingPerson = await GetPersonById(personId);
            if (!existingPerson) {
                alert('לקוח לא קיים')
                setpersonId('')
                return
            }
            else {
                const res2 = await GetLoansByPerson(personId)
                const loans = res2.filter((loan) => loan.status == 'pending' || loan.status == 'partial' || loan.status == 'overdue')
                if (loans.length == 1) {
                    setloanguarantors(loans[0].guarantors)
                    setSelectedRepayment({ ...selectedRepayment, loanId: loans[0].id })
                    setSelectedLoan(loans[0])
                }
                else if (loans.length == 0) {
                    alert("ללקוח זה אין הלוואה פעילה")
                    setpersonId('')
                    return
                }
                else
                    setFilterLoans(loans)
            }


        }
        catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
        }
    }
    const chooseLoan = () => {

    }
    const handleShowModal = (repayment = null) => {
        if (repayment) {
            setSelectedRepayment({
                loanId: repayment.loanId,
                amount: format(repayment.amount),
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
        if (!selectedRepayment.loanId) {
            setError('אנא בחר הלוואה לפני השליחה');
            return;
        }
        const maxAmount = SelectedLoan ? Number(SelectedLoan.amount) : Infinity;
        if (Number(selectedRepayment.amount.replace(/,/g, '')) > maxAmount) {
            setError(`הסכום לא יכול להיות גדול מסכום ההלוואה (${format(maxAmount)})`);
            return;
        }

        setError('');
        try {
            if (isEdit) {
                await UpdateRepayment(Id, selectedRepayment.loanId, selectedRepayment.Guarantor, selectedRepayment.amount.replace(/,/g, ''), selectedRepayment.paidDate, selectedRepayment.notes);
            } else {
                await CreateRepayment(selectedRepayment.loanId, selectedRepayment.Guarantor, selectedRepayment.amount.replace(/,/g, ''), selectedRepayment.paidDate, selectedRepayment.notes);
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
        <div className="container pt-5">
            <div className="d-flex  mb-3">
                <Button variant="warning" className="mb-3 ms-5" onClick={() => handleShowModal()}>הוסף תשלום</Button>
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

            <Table striped bordered hover >
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
                            <td>{formatAmount(repayment.amount, repayment.currency)}</td>
                            <td>{new Date(repayment.paidDate).toLocaleDateString()}</td>
                            <td>{repayment.loan?.amount || '-'}</td>
                            <td>{translaterepaymentType(repayment.loan?.repaymentType) || '-'}</td>
                            <td>{repayment.loan?.amountInMonth == "null" ? '-' : formatAmount(repayment.loan?.amountInMonth, repayment.currency)}</td>
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
            <div className="d-flex justify-content-between">
                <Button onClick={handlePrevPage} disabled={currentPage === 1}>⟵ קודם</Button>
                <span>דף {currentPage} מתוך {totalPages}</span>
                <Button onClick={handleNextPage} disabled={currentPage === totalPages}>הבא ⟶</Button>
            </div>
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton className="custom-header">
                    <Modal.Title className="ms-auto">
                        {isEdit ? 'עריכת תשלום' : 'הוספת תשלום חדש'}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body dir="rtl">
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
                        {filterLoans.length > 0 && (
                            <Form.Group className="mb-3">
                                <Form.Label>בחר הלוואה</Form.Label>
                                <Form.Select
                                    value={selectedRepayment.loanId}
                                    onChange={(e) => {
                                        const selectedLoan = filterLoans.find(loan => loan.id === Number(e.target.value));
                                        if (selectedLoan) {
                                            setloanguarantors(selectedLoan.guarantors);
                                            setSelectedRepayment({
                                                ...selectedRepayment,
                                                loanId: selectedLoan.id
                                            });
                                            setSelectedLoan(selectedLoan)
                                        }
                                    }}
                                    required
                                >
                                    <option value="">-- בחר הלוואה --</option>
                                    {filterLoans.map((loan) => (
                                        <option key={loan.id} value={loan.id}>
                                            הלוואה #{loan.numOfLoan} - {new Date(loan.startDate).toLocaleDateString('he-IL')}
                                        </option>
                                    ))}
                                </Form.Select>
                                {error && <div style={{ color: 'red', marginTop: '5px' }}>{error}</div>}
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>משולם על ידי</Form.Label>
                            <Form.Select
                                name="Guarantor"
                                value={selectedRepayment.Guarantor}
                                onChange={(e) => setSelectedRepayment({ ...selectedRepayment, Guarantor: e.target.value })}
                            >
                                <option value={false}>הלווה</option>
                                {loanguarantors.length > 0 && <option value={true}>ערב</option>}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>סכום</Form.Label>
                            <Form.Control
                                type="text"
                                name="amount"
                                value={selectedRepayment.amount}
                                onChange={handleAmountChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>תאריך</Form.Label>
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
                <Modal.Footer dir="rtl">
                    <Button variant="secondary" onClick={handleCloseModal}>ביטול</Button>
                    <Button variant="primary" onClick={handleSave}>שמור</Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
}

export default Repayment;
