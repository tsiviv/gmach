import React, { useEffect, useState } from 'react';
import { getMonthlyChecks } from '../servieces/Loans';
import { useNavigate } from 'react-router-dom';

export const MonthlyChecksNotification = () => {
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchChecks() {
            try {
                const res = await getMonthlyChecks();
                console.log(res)
                setChecks(res.checksThisMonth || []);
            } catch (err) {
                if (err.response?.status === 403 || err.response?.status === 401) {
                    navigate('../');
                }
                console.error('שגיאה בטעינת צ׳קים חודשיים:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchChecks();
    }, []);

    const groupedBySource = {
        loan: [],
        deposit: [],
        donation: [],
    };

    checks.forEach((c) => {
        if (groupedBySource[c.source]) {
            groupedBySource[c.source].push(c);
        }
    });

    const renderCheckItem = (check) => (
        <div key={`${check.source}-${check.loanId || check.depositId || check.donationId}`} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '10px',
            backgroundColor: '#fff',
            marginBottom: '10px',
        }}>
            <p><strong>סכום:</strong> ₪{check.amount?.toLocaleString()}</p>
            <p><strong>תאריך:</strong> {new Date(check.repaymentDate).toLocaleDateString()}</p>
            {check.type == "manual_adjustment" ? <p><strong>על ידי: </strong>הפקדת מנהל</p> : <>
                <p><strong>שם:</strong> {check.fullName || 'לא ידוע'}</p>
                <p><strong>מספר מזהה:</strong> {check.personId}</p></>}
        </div>
    );

    return (
        <div style={{
            border: '1px solid #ccc',
            padding: '1rem',
            borderRadius: '10px',
            backgroundColor: '#f9f9f9',
            maxWidth: '700px',
            margin: '2rem auto'
        }}>
            <h3>כל הצ׳קים של החודש הנוכחי</h3>

            {loading ? (
                <p>טוען...</p>
            ) : checks.length === 0 ? (
                <p>אין צ׳קים החודש</p>
            ) : (
                <>
                    {groupedBySource.loan.length > 0 && (
                        <>
                            <h4>תשלומי הלוואות</h4>
                            {groupedBySource.loan.map(renderCheckItem)}
                        </>
                    )}

                    {groupedBySource.deposit.length > 0 && (
                        <>
                            <h4>הפקדות</h4>
                            {groupedBySource.deposit.map(renderCheckItem)}
                        </>
                    )}

                    {groupedBySource.donation.length > 0 && (
                        <>
                            <h4>תרומות</h4>
                            {groupedBySource.donation.map(renderCheckItem)}
                        </>
                    )}
                </>
            )}
        </div>
    );
};
