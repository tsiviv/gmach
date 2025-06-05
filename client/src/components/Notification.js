import React, { useEffect, useState } from 'react';
import { getNotificationsStatus, setNotificationsStatus } from '../servieces/Notification';
import { GetOverdueLoans } from '../servieces/Loans';
import { useNavigate } from 'react-router-dom';
import { sendEmail } from '../servieces/Loans';

export const Notification = () => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [overdueLoans, setOverdueLoans] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        async function fetchData() {
            try {
                const status = await getNotificationsStatus();
                const loans = await GetOverdueLoans();
                setEnabled(status);
                setOverdueLoans(loans);
            } catch (err) {
                if (err.response?.status === 403 || err.response?.status === 401) {
                    navigate('../')
                }
                console.error('שגיאה בטעינה:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const handleChange = async (e) => {
        const newStatus = e.target.checked;
        setEnabled(newStatus);
        await setNotificationsStatus(newStatus);
    };
    const sendemail = async () => {
        try {
            const status = await sendEmail();
            alert(status)
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.log(err.response.data.message)
            alert("שגיאה בשליחת מייל");
        }
    }
    function translaterepaymentType(repaymentType) {
        const statusMap = {
            monthly: 'חודשי',
            once: 'חד פעמי',
        };

        return statusMap[repaymentType] || 'לא ידוע';
    }
    function translateLoanStatus(status) {
        const statusMap = {
            pending: 'פעילה',
            partial: 'שולמה חלקית',
            paid: 'שולמה',
            overdue: ' פיגור בתשלום',
            late_paid: 'שולמה באיחור',
            PaidBy_Gauartantor: 'שולמה על ידי ערב',
        };

        return statusMap[status] || 'לא ידוע';
    }
    return (
        <div style={{
            border: '1px solid #ccc',
            padding: '1rem',
            borderRadius: '10px',
            backgroundColor: '#f9f9f9',
            maxWidth: '700px',
            margin: 'auto'
        }}>
            <h3>התראות למייל</h3>
            <p>האם להפעיל התראות על הלוואות שלא שולמו?</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={enabled} onChange={handleChange} />
                <span>{enabled ? 'פעיל' : 'לא פעיל'}</span>
            </label>
            <button onClick={sendemail}>שלח לי למייל עכשיו את כל ההלוואת שלא שולמו</button>
            <hr style={{ margin: '1rem 0' }} />
            <h4>הלוואות שלא שולמו:</h4>
            {overdueLoans.length === 0 ? (
                <p>אין הלוואות באיחור</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {overdueLoans.map(loan => (
                        <div key={loan.id} style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '10px',
                            backgroundColor: '#fff'
                        }}>
                            <strong>הלוואה #{loan.numOfLoan}</strong>
                            <p>לווה: {loan.borrower?.fullName}</p>
                            <p>טלפון: {loan.borrower?.phone}</p>
                            <p>סכום הלוואה: ₪{loan.amount.toLocaleString()}</p>
                            <p>תאריך התחלה: {new Date(loan.startDate).toLocaleDateString()}</p>
                            <p> סוג החזר: {translaterepaymentType(loan.repaymentType)}</p>
                            {loan.repaymentType=='monthly'?<><p>יום לתשלום בחודש : {loan.repaymentDay}</p>
                            <p>סכום חודשי: ₪{loan.amountInMonth.toLocaleString()}</p></>:
                            <p>תאריך החזר: {new Date(loan.singleRepaymentDate).toLocaleDateString()}</p>}
                            <p>מספר איחורים: {loan.lateCount}</p>
                            <p>סטטוס: <strong style={{ color: 'red' }}>{translateLoanStatus(loan.status)}</strong></p>

                            {/* ערבים */}
                            {loan.guarantors?.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                    <h5 style={{ margin: '5px 0' }}>ערבים:</h5>
                                    <ul style={{ paddingRight: '20px' }}>
                                        {loan.guarantors.map(g => (
                                            <li key={g.id}>
                                                {g.guarantor?.fullName || 'לא ידוע'} ({g.PeopleId})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* תשלומים */}
                            {loan.repayments?.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                    <h5 style={{ margin: '5px 0' }}>תשלומים שבוצעו:</h5>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '0.9em'
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                                <th style={{ border: '1px solid #ccc', padding: '4px' }}>תאריך</th>
                                                <th style={{ border: '1px solid #ccc', padding: '4px' }}>סכום</th>
                                                <th style={{ border: '1px solid #ccc', padding: '4px' }}>הערות</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loan.repayments.map(r => (
                                                <tr key={r.id}>
                                                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{new Date(r.paidDate).toLocaleDateString()}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>₪{r.amount.toLocaleString()}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: '4px' }}>{r.notes || ''}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
