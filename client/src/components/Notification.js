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
    const sendemail = async() => {
        try {
            const status = await sendEmail();
            alert(status)
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                navigate('../')
            }
            console.log(err.response.data.message)
            alert( err.response.data.message);
        } 
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
            <button onClick={sendemail}>שלח לי למייל את כל ההלוואת שלא שולמו</button>
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
                            <p>סכום חודשי: ₪{loan.amountInMonth.toLocaleString()}</p>
                            <p>תאריך התחלה: {new Date(loan.startDate).toLocaleDateString()}</p>
                            <p>מספר איחורים: {loan.lateCount}</p>
                            <p>סטטוס: <strong style={{ color: 'red' }}>{translateLoanStatus(loan.status)}</strong></p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
